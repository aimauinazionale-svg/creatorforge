"use server";



import { z } from "zod";



import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";

import { safeAction } from "@/lib/actions/safe";

import type { SearchResultItem } from "@/lib/actions/types/search";

import { getIdeasFromCookie } from "@/lib/ideas/store";

import { resolveActor } from "@/lib/storage/actor";

import { getWorkflowsFromCookie } from "@/lib/workflow/store";

import { requireChannel } from "@/lib/actions/auth-context";



const SearchInputSchema = z.object({

  query: z.string().min(1).max(120),

});



function matchesQuery(text: string | null | undefined, query: string): boolean {

  if (!text) return false;

  return text.toLowerCase().includes(query.toLowerCase());

}



export async function globalSearchAction(

  raw: z.infer<typeof SearchInputSchema>

): Promise<ActionResult<{ results: SearchResultItem[] }>> {

  return safeAction(async () => {

    const parsed = SearchInputSchema.safeParse(raw);

    if (!parsed.success) return actionErr("INVALID_INPUT");



    const query = parsed.data.query.trim();

    const { actorId } = await resolveActor();

    const results: SearchResultItem[] = [];



    const channelCtx = await requireChannel();

    if (channelCtx.ok && !channelCtx.data.fromCookie) {

      const q = `%${query}%`;



      const { data: ideas, error: ideasError } = await channelCtx.data.supabase

        .from("ideas")

        .select("id,title,description")

        .eq("user_id", channelCtx.data.userId)

        .or(`title.ilike.${q},description.ilike.${q}`)

        .limit(8);



      if (!ideasError) {

        for (const idea of ideas ?? []) {

          results.push({

            id: idea.id,

            type: "idea",

            title: idea.title,

            href: "/ideas",

            subtitle: idea.description ?? undefined,

          });

        }

      }



      const { data: workflows, error: wfError } = await channelCtx.data.supabase

        .from("workflows")

        .select("id,title,description,status")

        .eq("channel_id", channelCtx.data.channelId)

        .or(`title.ilike.${q},description.ilike.${q}`)

        .limit(8);



      if (!wfError) {

        for (const wf of workflows ?? []) {

          results.push({

            id: wf.id,

            type: "workflow",

            title: wf.title,

            href: "/workflow",

            subtitle: wf.description ?? wf.status,

          });

        }

      }



      if (!ideasError && !wfError) return actionOk({ results: results.slice(0, 12) });

    }



    for (const idea of getIdeasFromCookie(actorId)) {

      if (matchesQuery(idea.title, query) || matchesQuery(idea.description, query)) {

        results.push({

          id: idea.id,

          type: "idea",

          title: idea.title,

          href: "/ideas",

          subtitle: idea.description ?? undefined,

        });

      }

    }



    for (const wf of getWorkflowsFromCookie(actorId)) {

      if (matchesQuery(wf.title, query) || matchesQuery(wf.description, query)) {

        results.push({

          id: wf.id,

          type: "workflow",

          title: wf.title,

          href: "/workflow",

          subtitle: wf.description ?? wf.status,

        });

      }

    }



    return actionOk({ results: results.slice(0, 12) });

  }, "globalSearchAction");

}


