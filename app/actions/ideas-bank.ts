"use server";



import { z } from "zod";



import { actionErr, actionOk, type ActionResult } from "@/lib/actions/result";

import { safeAction } from "@/lib/actions/safe";

import { requireChannel } from "@/lib/actions/auth-context";

import type { IdeaRow } from "@/lib/actions/types/ideas-bank";

import { getIdeasFromCookie, saveIdeasToCookie } from "@/lib/ideas/store";

import { getWorkflowsFromCookie, saveWorkflowsToCookie } from "@/lib/workflow/store";

import { resolveActor } from "@/lib/storage/actor";

import type { Database } from "@/types/database";



function mapIdea(row: {

  id: string;

  title: string;

  description: string | null;

  category: string | null;

  tags: string[] | null;

  priority: number;

  status: string;

  notes: string | null;

  created_at: string;

}): IdeaRow {

  return {

    id: row.id,

    title: row.title,

    description: row.description,

    category: row.category,

    tags: row.tags ?? [],

    priority: row.priority,

    status: row.status,

    notes: row.notes,

    createdAt: row.created_at,

  };

}



async function getDbUserContext() {

  const actor = await resolveActor();

  if (actor.isGuest) return null;

  return { supabase: actor.supabase, userId: actor.actorId };

}



export async function listIdeasAction(): Promise<ActionResult<{ ideas: IdeaRow[] }>> {

  return safeAction(async () => {

    const { actorId } = await resolveActor();

    const db = await getDbUserContext();



    if (db) {

      const { data, error } = await db.supabase

        .from("ideas")

        .select("id,title,description,category,tags,priority,status,notes,created_at")

        .eq("user_id", db.userId)

        .order("created_at", { ascending: false });



      if (!error) return actionOk({ ideas: (data ?? []).map(mapIdea) });

    }



    return actionOk({ ideas: getIdeasFromCookie(actorId) });

  }, "listIdeasAction");

}



const IdeaInputSchema = z.object({

  title: z.string().min(2).max(200),

  description: z.string().max(2000).optional().nullable(),

  category: z.string().max(80).optional().nullable(),

  tags: z.array(z.string().max(40)).max(20).optional().nullable(),

  priority: z.number().int().min(0).max(2).default(1),

  status: z.enum(["active", "archived"]).default("active"),

  notes: z.string().max(5000).optional().nullable(),

});



export async function createIdeaAction(

  raw: z.infer<typeof IdeaInputSchema>

): Promise<ActionResult<{ idea: IdeaRow }>> {

  return safeAction(async () => {

    const parsed = IdeaInputSchema.safeParse(raw);

    if (!parsed.success) return actionErr("INVALID_INPUT");



    const { actorId } = await resolveActor();

    const db = await getDbUserContext();



    if (db) {

      const { data, error } = await db.supabase

        .from("ideas")

        .insert({

          user_id: db.userId,

          title: parsed.data.title.trim(),

          description: parsed.data.description ?? null,

          category: parsed.data.category ?? null,

          tags: parsed.data.tags ?? null,

          priority: parsed.data.priority,

          status: parsed.data.status,

          notes: parsed.data.notes ?? null,

        })

        .select("id,title,description,category,tags,priority,status,notes,created_at")

        .single();



      if (!error && data) return actionOk({ idea: mapIdea(data) });

    }



    const idea: IdeaRow = {

      id: crypto.randomUUID(),

      title: parsed.data.title.trim(),

      description: parsed.data.description ?? null,

      category: parsed.data.category ?? null,

      tags: parsed.data.tags ?? [],

      priority: parsed.data.priority,

      status: parsed.data.status,

      notes: parsed.data.notes ?? null,

      createdAt: new Date().toISOString(),

    };

    const ideas = getIdeasFromCookie(actorId);

    saveIdeasToCookie(actorId, [idea, ...ideas]);

    return actionOk({ idea });

  }, "createIdeaAction");

}



export async function updateIdeaAction(

  id: string,

  raw: Partial<z.infer<typeof IdeaInputSchema>>

): Promise<ActionResult<{ idea: IdeaRow }>> {

  return safeAction(async () => {

    const parsed = IdeaInputSchema.partial().safeParse(raw);

    if (!parsed.success) return actionErr("INVALID_INPUT");



    const { actorId } = await resolveActor();

    const db = await getDbUserContext();



    if (db) {

      const patch: Database["public"]["Tables"]["ideas"]["Update"] = {};

      if (parsed.data.title !== undefined) patch.title = parsed.data.title.trim();

      if (parsed.data.description !== undefined) patch.description = parsed.data.description;

      if (parsed.data.category !== undefined) patch.category = parsed.data.category;

      if (parsed.data.tags !== undefined) patch.tags = parsed.data.tags;

      if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;

      if (parsed.data.status !== undefined) patch.status = parsed.data.status;

      if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;



      const { data, error } = await db.supabase

        .from("ideas")

        .update(patch)

        .eq("id", id)

        .eq("user_id", db.userId)

        .select("id,title,description,category,tags,priority,status,notes,created_at")

        .maybeSingle();



      if (!error && data) return actionOk({ idea: mapIdea(data) });

    }



    const ideas = getIdeasFromCookie(actorId);

    const idx = ideas.findIndex((i) => i.id === id);

    if (idx < 0) return actionErr("NOT_FOUND");



    const existing = ideas[idx];

    const updated: IdeaRow = {

      ...existing,

      title: parsed.data.title !== undefined ? parsed.data.title.trim() : existing.title,

      description: parsed.data.description !== undefined ? parsed.data.description : existing.description,

      category: parsed.data.category !== undefined ? parsed.data.category : existing.category,

      tags: parsed.data.tags !== undefined ? (parsed.data.tags ?? []) : existing.tags,

      priority: parsed.data.priority ?? existing.priority,

      status: parsed.data.status ?? existing.status,

      notes: parsed.data.notes !== undefined ? parsed.data.notes : existing.notes,

    };

    const next = [...ideas];

    next[idx] = updated;

    saveIdeasToCookie(actorId, next);

    return actionOk({ idea: updated });

  }, "updateIdeaAction");

}



export async function deleteIdeaAction(id: string): Promise<ActionResult<{ deleted: true }>> {

  return safeAction(async () => {

    const { actorId } = await resolveActor();

    const db = await getDbUserContext();



    if (db) {

      const { data, error } = await db.supabase

        .from("ideas")

        .delete()

        .eq("id", id)

        .eq("user_id", db.userId)

        .select("id");



      if (!error && data?.length) return actionOk({ deleted: true });

    }



    const ideas = getIdeasFromCookie(actorId);

    const next = ideas.filter((i) => i.id !== id);

    if (next.length === ideas.length) return actionErr("NOT_FOUND");

    saveIdeasToCookie(actorId, next);

    return actionOk({ deleted: true });

  }, "deleteIdeaAction");

}



export async function createWorkflowFromIdeaAction(

  ideaId: string

): Promise<ActionResult<{ workflowId: string }>> {

  return safeAction(async () => {

    const { actorId } = await resolveActor();

    const db = await getDbUserContext();

    const channelCtx = await requireChannel();



    let idea: { title: string; description: string | null; notes: string | null } | null = null;



    if (db) {

      const { data, error } = await db.supabase

        .from("ideas")

        .select("id,title,description,notes")

        .eq("id", ideaId)

        .eq("user_id", db.userId)

        .maybeSingle();



      if (!error && data) {

        idea = { title: data.title, description: data.description, notes: data.notes };

      }

    }



    if (!idea) {

      const cookieIdea = getIdeasFromCookie(actorId).find((i) => i.id === ideaId);

      if (!cookieIdea) return actionErr("NOT_FOUND");

      idea = {

        title: cookieIdea.title,

        description: cookieIdea.description,

        notes: cookieIdea.notes,

      };

    }



    if (channelCtx.ok && !channelCtx.data.fromCookie) {

      const { data: inserted, error: insertError } = await channelCtx.data.supabase

        .from("workflows")

        .insert({

          channel_id: channelCtx.data.channelId,

          title: idea.title,

          description: idea.description,

          notes: idea.notes,

          status: "idea",

          order: 0,

        })

        .select("id")

        .single();



      if (!insertError && inserted) return actionOk({ workflowId: inserted.id });

    }



    const cards = getWorkflowsFromCookie(actorId);

    const workflowId = crypto.randomUUID();

    const card = {

      id: workflowId,

      title: idea.title,

      description: idea.description,

      notes: idea.notes,

      status: "idea" as const,

      dueDate: null,

      order: cards.filter((c) => c.status === "idea").length,

      youtubeVideoId: null,

      createdAt: new Date().toISOString(),

    };

    saveWorkflowsToCookie(actorId, [...cards, card]);

    return actionOk({ workflowId });

  }, "createWorkflowFromIdeaAction");

}



export async function exportIdeasAction(): Promise<ActionResult<{ json: string }>> {

  return safeAction(async () => {

    const res = await listIdeasAction();

    if (!res.ok) return res;

    return actionOk({ json: JSON.stringify(res.data.ideas, null, 2) });

  }, "exportIdeasAction");

}



const BulkUpdateSchema = z.object({

  ids: z.array(z.string().uuid()).min(1),

  status: z.enum(["active", "archived"]).optional(),

  priority: z.number().int().min(0).max(2).optional(),

});



export async function bulkUpdateIdeasAction(

  raw: z.infer<typeof BulkUpdateSchema>

): Promise<ActionResult<{ updated: number }>> {

  return safeAction(async () => {

    const parsed = BulkUpdateSchema.safeParse(raw);

    if (!parsed.success) return actionErr("INVALID_INPUT");



    const { actorId } = await resolveActor();

    const db = await getDbUserContext();



    if (db) {

      const patch: Database["public"]["Tables"]["ideas"]["Update"] = {};

      if (parsed.data.status !== undefined) patch.status = parsed.data.status;

      if (parsed.data.priority !== undefined) patch.priority = parsed.data.priority;

      if (Object.keys(patch).length === 0) return actionErr("INVALID_INPUT");



      const { data, error } = await db.supabase

        .from("ideas")

        .update(patch)

        .in("id", parsed.data.ids)

        .eq("user_id", db.userId)

        .select("id");



      if (!error) return actionOk({ updated: data?.length ?? 0 });

    }



    const ids = new Set(parsed.data.ids);

    const ideas = getIdeasFromCookie(actorId);

    let updated = 0;

    const next = ideas.map((idea) => {

      if (!ids.has(idea.id)) return idea;

      updated += 1;

      return {

        ...idea,

        status: parsed.data.status ?? idea.status,

        priority: parsed.data.priority ?? idea.priority,

      };

    });

    saveIdeasToCookie(actorId, next);

    return actionOk({ updated });

  }, "bulkUpdateIdeasAction");

}



export async function bulkDeleteIdeasAction(

  ids: string[]

): Promise<ActionResult<{ deleted: number }>> {

  return safeAction(async () => {

    if (!ids.length) return actionErr("INVALID_INPUT");



    const { actorId } = await resolveActor();

    const db = await getDbUserContext();



    if (db) {

      const { data, error } = await db.supabase

        .from("ideas")

        .delete()

        .in("id", ids)

        .eq("user_id", db.userId)

        .select("id");



      if (!error) return actionOk({ deleted: data?.length ?? 0 });

    }



    const idSet = new Set(ids);

    const ideas = getIdeasFromCookie(actorId);

    const next = ideas.filter((i) => !idSet.has(i.id));

    const deleted = ideas.length - next.length;

    saveIdeasToCookie(actorId, next);

    return actionOk({ deleted });

  }, "bulkDeleteIdeasAction");

}


