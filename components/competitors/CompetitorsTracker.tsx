"use client";



import * as React from "react";

import Image from "next/image";

import { useTranslations } from "next-intl";

import { ExternalLink, Loader2, RefreshCw, Search, Sparkles, Swords, Trash2 } from "lucide-react";



import {

  addCompetitorAction,

  autoDiscoverCompetitorsAction,

  discoverCompetitorsByNicheAction,

  listCompetitorsAction,

  refreshAllCompetitorsAction,

  refreshCompetitorAction,

  removeCompetitorAction,

} from "@/app/actions/competitors";

import { getChannelConnectionAction } from "@/app/actions/youtube";

import type { CompetitorRow } from "@/lib/actions/types/competitors";

import { getContentGapHintsAction } from "@/app/actions/dashboard";

import { ActionErrorAlert } from "@/components/errors/ActionErrorAlert";

import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Label } from "@/components/ui/label";

import { Skeleton } from "@/components/ui/skeleton";

import { formatNumber } from "@/lib/formatNumber";

import { useToast } from "@/hooks/use-toast";



const LIMIT = 5;



type ActionShape = { ok: boolean };



function hasActionResult<T extends ActionShape>(

  res: T | null | undefined

): res is T {

  return res != null && typeof res.ok === "boolean";

}



export function CompetitorsTracker() {

  const t = useTranslations("competitors");

  const { toast } = useToast();

  const [items, setItems] = React.useState<CompetitorRow[]>([]);

  const [hints, setHints] = React.useState<string[]>([]);

  const [loading, setLoading] = React.useState(true);

  const [discovering, setDiscovering] = React.useState(false);

  const [searchingByNiche, setSearchingByNiche] = React.useState(false);

  const [channelConnected, setChannelConnected] = React.useState(false);

  const [showNicheForm, setShowNicheForm] = React.useState(false);

  const [discoveryError, setDiscoveryError] = React.useState<string | null>(null);

  const [error, setError] = React.useState<string | null>(null);

  const [url, setUrl] = React.useState("");

  const [niche, setNiche] = React.useState("");

  const [busy, setBusy] = React.useState(false);

  const discoveryAttempted = React.useRef(false);



  const loadList = React.useCallback(async () => {

    const [list, gap] = await Promise.all([listCompetitorsAction(), getContentGapHintsAction()]);



    if (!hasActionResult(list)) {

      setError("UNKNOWN");

      setItems([]);

      return null;

    }



    if (list.ok) {

      setItems(list.data.competitors);

    } else if (list.error.code !== "DB_ERROR") {

      setError(list.error.code);

      setItems([]);

    }



    if (hasActionResult(gap) && gap.ok) {

      setHints(gap.data.hints);

    }



    return list;

  }, []);



  const handleDiscoveryResult = React.useCallback(

    async (res: Awaited<ReturnType<typeof autoDiscoverCompetitorsAction>>) => {

      if (!hasActionResult(res)) {

        toast({ variant: "destructive", title: t("errors.YOUTUBE_ERROR") });

        return;

      }



      if (!res.ok) {

        if (res.error.code === "NOT_CONFIGURED") {

          setDiscoveryError("NOT_CONFIGURED");

        } else if (res.error.code !== "NOT_CONNECTED") {

          setDiscoveryError(res.error.code);

        }

        return;

      }



      if (res.data.added > 0) {

        setShowNicheForm(false);

        toast({

          title: t("discovery.successTitle"),

          description: t("discovery.successDescription", { count: res.data.added }),

        });

        await loadList();

        return;

      }



      if (res.data.suggestManualNiche) {

        setShowNicheForm(true);

      }

    },

    [loadList, t, toast]

  );



  const runAutoDiscovery = React.useCallback(async () => {

    setDiscovering(true);

    setDiscoveryError(null);

    try {

      const res = await autoDiscoverCompetitorsAction();

      await handleDiscoveryResult(res);

    } finally {

      setDiscovering(false);

    }

  }, [handleDiscoveryResult]);



  const load = React.useCallback(async () => {

    setLoading(true);

    setError(null);



    const connection = await getChannelConnectionAction();

    const connected = hasActionResult(connection) && connection.ok && connection.data.connected;

    setChannelConnected(connected);



    const list = await loadList();



    if (

      connected &&

      hasActionResult(list) &&

      list.ok &&

      list.data.competitors.length === 0 &&

      !discoveryAttempted.current

    ) {

      discoveryAttempted.current = true;

      await runAutoDiscovery();

    }



    setLoading(false);

  }, [loadList, runAutoDiscovery]);



  React.useEffect(() => {

    void load();

  }, [load]);



  async function onAdd(e: React.FormEvent) {

    e.preventDefault();

    if (!url.trim()) return;

    setBusy(true);

    const res = await addCompetitorAction({ channelUrl: url });

    setBusy(false);

    if (!hasActionResult(res) || !res.ok) {

      const code = hasActionResult(res) && !res.ok ? res.error.code : "YOUTUBE_ERROR";

      toast({ variant: "destructive", title: t(`errors.${code}`) });

      return;

    }

    toast({

      title: t("toasts.addSuccessTitle"),

      description: t("toasts.addSuccessDescription", { name: res.data.competitor.channelName }),

    });

    setUrl("");

    setShowNicheForm(false);

    void loadList();

  }



  async function onSearchByNiche(e: React.FormEvent) {

    e.preventDefault();

    const trimmed = niche.trim();

    if (!trimmed) return;



    setSearchingByNiche(true);

    setDiscoveryError(null);

    try {

      const res = await discoverCompetitorsByNicheAction({ niche: trimmed });

      if (!hasActionResult(res)) {

        toast({ variant: "destructive", title: t("errors.YOUTUBE_ERROR") });

        return;

      }



      if (!res.ok) {

        toast({ variant: "destructive", title: t(`errors.${res.error.code}`) });

        return;

      }



      if (res.data.added > 0) {

        setShowNicheForm(false);

        toast({

          title: t("discovery.successTitle"),

          description: t("discovery.successDescription", { count: res.data.added }),

        });

        await loadList();

        return;

      }



      toast({

        variant: "destructive",

        title: t("niche.noResultsTitle"),

        description: t("niche.noResultsDescription"),

      });

    } finally {

      setSearchingByNiche(false);

    }

  }



  async function onRefreshAll() {

    setBusy(true);

    const res = await refreshAllCompetitorsAction();

    setBusy(false);

    if (hasActionResult(res) && res.ok) {

      toast({

        title: t("toasts.refreshAllSuccessTitle"),

        description: t("toasts.refreshAllSuccessDescription", { count: res.data.count }),

      });

      void loadList();

    }

  }



  if (loading) {

    return (

      <div className="space-y-4">

        <Skeleton className="h-10 w-48" />

        <Skeleton className="h-40" />

      </div>

    );

  }



  if (error && error !== "DB_ERROR") {

    return <ActionErrorAlert code={error} onRetry={() => void load()} />;

  }



  const discoveryBusy = discovering || searchingByNiche;



  return (

    <div className="space-y-6">

      {discovering ? (

        <Card className="border-rose-500/20 bg-rose-500/5">

          <CardContent className="flex items-center gap-3 p-4 text-sm text-muted-foreground">

            <Loader2 className="h-4 w-4 animate-spin text-rose-500" aria-hidden="true" />

            <span>{t("discovery.analyzing")}</span>

          </CardContent>

        </Card>

      ) : null}



      {!channelConnected && !discoveryBusy ? (

        <Card className="border-amber-500/20 bg-amber-500/5">

          <CardContent className="p-4 text-sm text-muted-foreground">

            {t("discovery.noChannel")}

          </CardContent>

        </Card>

      ) : null}



      {discoveryError === "NOT_CONFIGURED" ? (

        <Card className="border-amber-500/20 bg-amber-500/5">

          <CardContent className="p-4 text-sm text-muted-foreground">

            {t("discovery.notConfigured")}

          </CardContent>

        </Card>

      ) : null}



      {showNicheForm && channelConnected && items.length === 0 && !discovering ? (

        <Card className="border-rose-500/20 bg-rose-500/5">

          <CardHeader>

            <CardTitle className="text-base">{t("niche.searchByNiche")}</CardTitle>

            <p className="text-sm text-muted-foreground">{t("niche.noNicheDetected")}</p>

          </CardHeader>

          <CardContent>

            <form onSubmit={onSearchByNiche} className="flex flex-col gap-3 sm:flex-row">

              <div className="flex-1 space-y-1">

                <Label htmlFor="competitor-niche">{t("niche.inputLabel")}</Label>

                <Input

                  id="competitor-niche"

                  value={niche}

                  onChange={(e) => setNiche(e.target.value)}

                  placeholder={t("niche.placeholder")}

                  disabled={searchingByNiche}

                />

              </div>

              <Button

                type="submit"

                className="sm:self-end"

                disabled={searchingByNiche || !niche.trim()}

              >

                {searchingByNiche ? (

                  <>

                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />

                    {t("niche.submitting")}

                  </>

                ) : (

                  <>

                    <Search className="mr-2 h-4 w-4" aria-hidden="true" />

                    {t("niche.submit")}

                  </>

                )}

              </Button>

            </form>

          </CardContent>

        </Card>

      ) : null}



      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

        <p className="text-sm text-muted-foreground">

          {t("limitWarning.description", { current: items.length, limit: LIMIT })}

        </p>

        <Button

          variant="outline"

          size="sm"

          onClick={() => void onRefreshAll()}

          disabled={busy || discoveryBusy || !items.length}

        >

          <RefreshCw className="mr-2 h-4 w-4" />

          {t("actions.refreshAll")}

        </Button>

      </div>



      <Card>

        <CardHeader>

          <CardTitle className="text-base">{t("addSection.titleManual")}</CardTitle>

          <p className="text-sm text-muted-foreground">{t("addSection.description")}</p>

        </CardHeader>

        <CardContent>

          <form onSubmit={onAdd} className="flex flex-col gap-3 sm:flex-row">

            <div className="flex-1 space-y-1">

              <Label htmlFor="competitor-url">{t("form.channelUrlLabel")}</Label>

              <Input

                id="competitor-url"

                value={url}

                onChange={(e) => setUrl(e.target.value)}

                placeholder={t("form.channelUrlPlaceholder")}

                disabled={items.length >= LIMIT || discoveryBusy}

              />

            </div>

            <Button

              type="submit"

              variant="outline"

              className="sm:self-end"

              disabled={busy || discoveryBusy || items.length >= LIMIT}

            >

              {busy ? t("form.submitting") : t("form.submit")}

            </Button>

          </form>

        </CardContent>

      </Card>



      {hints.length > 0 ? (

        <Card className="border-rose-500/20 bg-rose-500/5">

          <CardHeader>

            <CardTitle className="text-sm">{t("contentGap.title")}</CardTitle>

          </CardHeader>

          <CardContent className="space-y-2 text-sm text-muted-foreground">

            {hints.map((h) => (

              <p key={h}>• {h}</p>

            ))}

          </CardContent>

        </Card>

      ) : null}



      {items.length === 0 && !discoveryBusy ? (

        <Card>

          <CardContent className="flex flex-col items-center gap-4 p-10 text-center">

            <Swords className="h-10 w-10 text-muted-foreground" />

            <div>

              <h2 className="text-lg font-semibold">{t("empty.title")}</h2>

              <p className="text-sm text-muted-foreground">

                {channelConnected ? t("empty.descriptionAuto") : t("empty.description")}

              </p>

            </div>

            {channelConnected && !showNicheForm ? (

              <Button

                variant="outline"

                size="sm"

                onClick={() => {

                  discoveryAttempted.current = false;

                  void runAutoDiscovery();

                }}

                disabled={discoveryBusy}

              >

                <Sparkles className="mr-2 h-4 w-4" />

                {t("discovery.retry")}

              </Button>

            ) : null}

          </CardContent>

        </Card>

      ) : (

        <div className="grid gap-4 md:grid-cols-2">

          {items.map((c) => (

            <Card key={c.id}>

              <CardContent className="flex gap-4 p-4">

                {c.thumbnailUrl ? (

                  <Image src={c.thumbnailUrl} alt="" width={56} height={56} className="rounded-full" />

                ) : (

                  <div className="grid h-14 w-14 place-items-center rounded-full bg-muted">

                    <Swords className="h-6 w-6 text-muted-foreground" />

                  </div>

                )}

                <div className="min-w-0 flex-1 space-y-2">

                  <div className="flex items-start justify-between gap-2">

                    <div>

                      <div className="flex flex-wrap items-center gap-2">

                        <p className="font-medium">{c.channelName}</p>

                        {c.autoDiscovered ? (

                          <Badge variant="secondary" className="text-xs">

                            <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />

                            {t("discovery.autoDiscovered")}

                          </Badge>

                        ) : null}

                      </div>

                      <p className="text-xs text-muted-foreground">

                        {t("stats.summary", {

                          subscribers: formatNumber(c.subscriberCount),

                          views: formatNumber(c.viewCount),

                        })}

                      </p>

                    </div>

                    <div className="flex gap-1">

                      <Button

                        type="button"

                        size="icon"

                        variant="ghost"

                        onClick={() =>

                          void refreshCompetitorAction(c.id).then((res) => {

                            if (hasActionResult(res) && res.ok) void loadList();

                          })

                        }

                        aria-label={t("actions.refresh")}

                      >

                        <RefreshCw className="h-4 w-4" />

                      </Button>

                      <Button

                        type="button"

                        size="icon"

                        variant="ghost"

                        onClick={() =>

                          void removeCompetitorAction(c.id).then((res) => {

                            if (hasActionResult(res) && res.ok) void loadList();

                          })

                        }

                        aria-label={t("actions.remove")}

                      >

                        <Trash2 className="h-4 w-4" />

                      </Button>

                      {c.channelUrl ? (

                        <Button type="button" size="icon" variant="ghost" asChild>

                          <a

                            href={c.channelUrl}

                            target="_blank"

                            rel="noreferrer"

                            aria-label={t("card.openChannel")}

                          >

                            <ExternalLink className="h-4 w-4" />

                          </a>

                        </Button>

                      ) : null}

                    </div>

                  </div>

                  <div className="flex gap-4 text-xs text-muted-foreground">

                    <span>

                      {t("stats.videos")}: {formatNumber(c.videoCount)}

                    </span>

                  </div>

                </div>

              </CardContent>

            </Card>

          ))}

        </div>

      )}

    </div>

  );

}


