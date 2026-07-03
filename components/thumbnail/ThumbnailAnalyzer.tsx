"use client";

import * as React from "react";
import Image from "next/image";
import { useDropzone } from "react-dropzone";
import { useTranslations } from "next-intl";
import { ImageIcon, Loader2 } from "lucide-react";

import { analyzeThumbnailSource, type ThumbnailAnalysis } from "@/lib/thumbnail/analyze";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

async function detectText(source: string | File): Promise<string> {
  try {
    const { createWorker } = await import("tesseract.js");
    const worker = await createWorker("eng");
    const result = await worker.recognize(source instanceof File ? source : source);
    await worker.terminate();
    return result.data.text;
  } catch {
    return "";
  }
}

export function ThumbnailAnalyzer() {
  const t = useTranslations("thumbnail");
  const { toast } = useToast();
  const [url, setUrl] = React.useState("");
  const [file, setFile] = React.useState<File | null>(null);
  const [preview, setPreview] = React.useState<string | null>(null);
  const [analysis, setAnalysis] = React.useState<ThumbnailAnalysis | null>(null);
  const [analyzing, setAnalyzing] = React.useState(false);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [".png", ".jpg", ".jpeg", ".webp"] },
    maxSize: 5 * 1024 * 1024,
    maxFiles: 1,
    onDrop: (accepted) => {
      const f = accepted[0];
      if (!f) return;
      setFile(f);
      setPreview(URL.createObjectURL(f));
      setAnalysis(null);
    },
  });

  async function runAnalysis(source: string | File) {
    setAnalyzing(true);
    try {
      let detectedText = "";
      detectedText = await detectText(source);
      const result = await analyzeThumbnailSource(source, detectedText);
      setAnalysis(result);
      toast({ title: t("toasts.analyzedTitle"), description: t("toasts.analyzedBody") });
    } catch {
      toast({ variant: "destructive", title: t("toasts.errorTitle") });
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="upload">
        <TabsList>
          <TabsTrigger value="upload">{t("tabs.upload")}</TabsTrigger>
          <TabsTrigger value="url">{t("tabs.url")}</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-4">
          <Card>
            <CardContent
              {...getRootProps()}
              className={`flex cursor-pointer flex-col items-center gap-4 p-10 text-center ${isDragActive ? "bg-muted/50" : ""}`}
            >
              <input {...getInputProps()} aria-label={t("upload.dropzoneAria")} />
              <ImageIcon className="h-10 w-10 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {isDragActive ? t("upload.dropActive") : t("upload.dropIdle")}
              </p>
              <p className="text-xs text-muted-foreground">{t("upload.limits")}</p>
            </CardContent>
          </Card>
          {file ? (
            <Button className="mt-3" onClick={() => void runAnalysis(file)} disabled={analyzing}>
              {analyzing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {analyzing ? t("actions.analyzing") : t("actions.analyze")}
            </Button>
          ) : null}
        </TabsContent>

        <TabsContent value="url" className="mt-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="thumbnail-url">{t("url.label")}</Label>
            <Input id="thumbnail-url" type="url" value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t("url.placeholder")} />
          </div>
          <Button type="button" onClick={() => void runAnalysis(url)} disabled={!url.trim() || analyzing}>
            {analyzing ? t("actions.analyzing") : t("actions.analyze")}
          </Button>
        </TabsContent>
      </Tabs>

      <div className="grid gap-6 lg:grid-cols-2">
        {(preview || url) && (
          <Card>
            <CardHeader><CardTitle className="text-sm">{t("results.previewTitle")}</CardTitle></CardHeader>
            <CardContent>
              <Image
                src={preview ?? url}
                alt={t("results.previewAlt")}
                width={640}
                height={360}
                className="rounded-lg border object-cover"
                unoptimized
              />
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-6">
            {!analysis ? (
              <p className="text-sm text-muted-foreground">{t("results.empty")}</p>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">{t("results.scoreSubtitle")}</p>
                  <p className="text-4xl font-semibold">{analysis.overallScore}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(analysis.breakdown).map(([key, value]) => (
                    <div key={key} className="flex justify-between rounded border px-2 py-1">
                      <span>{t(`results.breakdown.${key}` as never)}</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{t("results.suggestionsTitle")}</p>
                  {analysis.suggestions.map((s) => (
                    <div key={s.message} className="text-sm">
                      <Badge variant={s.priority === "high" ? "outline" : "secondary"}>
                        {t(`results.priority.${s.priority}`)}
                      </Badge>
                      <p className="mt-1 text-muted-foreground">{s.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
