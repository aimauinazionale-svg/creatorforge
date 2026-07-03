"use server";



import { z } from "zod";



import {

  WORKFLOW_STATUSES,

  type WorkflowCard,

  type WorkflowStatus,

} from "@/components/workflow/types";

import { requireChannel } from "@/lib/actions/auth-context";

import { safeRun } from "@/lib/actions/safe";

import type { WorkflowActionErrorCode, WorkflowActionResult } from "@/lib/actions/types/workflow";

import { resolveActor } from "@/lib/storage/actor";

import { getWorkflowsFromCookie, saveWorkflowsToCookie } from "@/lib/workflow/store";

import type { Database } from "@/types/database";



function workflowErr(

  code: WorkflowActionErrorCode,

  details?: string

): Extract<WorkflowActionResult<never>, { ok: false }> {

  return { ok: false, error: { code, details } };

}



async function getDbChannelContext() {

  const ctx = await requireChannel();

  if (!ctx.ok || ctx.data.fromCookie) return null;

  return { supabase: ctx.data.supabase, channelId: ctx.data.channelId };

}



function isStatus(value: string): value is WorkflowStatus {

  return (WORKFLOW_STATUSES as readonly string[]).includes(value);

}



function mapRow(row: {

  id: string;

  title: string;

  description: string | null;

  status: string;

  notes: string | null;

  due_date: string | null;

  order: number;

  youtube_video_id: string | null;

  created_at: string;

}): WorkflowCard | null {

  if (!isStatus(row.status)) return null;

  return {

    id: row.id,

    title: row.title,

    description: row.description,

    status: row.status,

    notes: row.notes,

    dueDate: row.due_date,

    order: row.order,

    youtubeVideoId: row.youtube_video_id,

    createdAt: row.created_at,

  };

}



export async function listWorkflowsAction(): Promise<WorkflowActionResult<{ cards: WorkflowCard[] }>> {

  try {

    const { actorId } = await resolveActor();

    const db = await getDbChannelContext();



    if (db) {

      const { data, error } = await db.supabase

        .from("workflows")

        .select("*")

        .eq("channel_id", db.channelId)

        .order("order", { ascending: true });



      if (!error) {

        const cards = (data ?? []).map(mapRow).filter((c): c is WorkflowCard => Boolean(c));

        return { ok: true, data: { cards } };

      }

    }



    return { ok: true, data: { cards: getWorkflowsFromCookie(actorId) } };

  } catch (err) {

    console.error("[server-action:listWorkflows]", err);

    return { ok: true, data: { cards: [] } };

  }

}



const CreateSchema = z.object({

  title: z.string().min(2).max(200),

  status: z.enum(WORKFLOW_STATUSES).default("idea"),

  description: z.string().max(2000).optional().nullable(),

  notes: z.string().max(5000).optional().nullable(),

  dueDate: z.string().datetime().optional().nullable(),

});



export async function createWorkflowAction(

  input: z.infer<typeof CreateSchema>

): Promise<WorkflowActionResult<{ card: WorkflowCard }>> {

  return safeRun<WorkflowActionResult<{ card: WorkflowCard }>>(

    async () => {

      const parsed = CreateSchema.safeParse(input);

      if (!parsed.success) return workflowErr("INVALID_INPUT");



      const { actorId } = await resolveActor();

      const db = await getDbChannelContext();



      if (db) {

        const { count } = await db.supabase

          .from("workflows")

          .select("id", { count: "exact", head: true })

          .eq("channel_id", db.channelId)

          .eq("status", parsed.data.status);



        const { data, error } = await db.supabase

          .from("workflows")

          .insert({

            channel_id: db.channelId,

            title: parsed.data.title.trim(),

            status: parsed.data.status,

            description: parsed.data.description ?? null,

            notes: parsed.data.notes ?? null,

            due_date: parsed.data.dueDate ?? null,

            order: count ?? 0,

          })

          .select("*")

          .single();



        if (!error && data) {

          const card = mapRow(data);

          if (card) return { ok: true, data: { card } };

        }

      }



      const cards = getWorkflowsFromCookie(actorId);

      const order = cards.filter((c) => c.status === parsed.data.status).length;

      const card: WorkflowCard = {

        id: crypto.randomUUID(),

        title: parsed.data.title.trim(),

        status: parsed.data.status,

        description: parsed.data.description ?? null,

        notes: parsed.data.notes ?? null,

        dueDate: parsed.data.dueDate ?? null,

        order,

        youtubeVideoId: null,

        createdAt: new Date().toISOString(),

      };

      saveWorkflowsToCookie(actorId, [...cards, card]);

      return { ok: true, data: { card } };

    },

    (details) => workflowErr("DB_ERROR", details),

    "createWorkflow"

  );

}



const UpdateSchema = z.object({

  title: z.string().min(2).max(200).optional(),

  status: z.enum(WORKFLOW_STATUSES).optional(),

  description: z.string().max(2000).optional().nullable(),

  notes: z.string().max(5000).optional().nullable(),

  dueDate: z.string().datetime().optional().nullable(),

  order: z.number().int().min(0).optional(),

  youtubeVideoId: z.string().max(20).optional().nullable(),

});



export async function updateWorkflowAction(

  id: string,

  input: z.infer<typeof UpdateSchema>

): Promise<WorkflowActionResult<{ card: WorkflowCard }>> {

  return safeRun<WorkflowActionResult<{ card: WorkflowCard }>>(

    async () => {

      const parsed = UpdateSchema.safeParse(input);

      if (!parsed.success) return workflowErr("INVALID_INPUT");



      const { actorId } = await resolveActor();

      const db = await getDbChannelContext();



      if (db) {

        const patch: Database["public"]["Tables"]["workflows"]["Update"] = {};

        if (parsed.data.title !== undefined) patch.title = parsed.data.title.trim();

        if (parsed.data.status !== undefined) patch.status = parsed.data.status;

        if (parsed.data.description !== undefined) patch.description = parsed.data.description;

        if (parsed.data.notes !== undefined) patch.notes = parsed.data.notes;

        if (parsed.data.dueDate !== undefined) patch.due_date = parsed.data.dueDate;

        if (parsed.data.order !== undefined) patch.order = parsed.data.order;

        if (parsed.data.youtubeVideoId !== undefined) patch.youtube_video_id = parsed.data.youtubeVideoId;



        const { data, error } = await db.supabase

          .from("workflows")

          .update(patch)

          .eq("id", id)

          .eq("channel_id", db.channelId)

          .select("*")

          .maybeSingle();



        if (!error && data) {

          const card = mapRow(data);

          if (card) return { ok: true, data: { card } };

        }

      }



      const cards = getWorkflowsFromCookie(actorId);

      const idx = cards.findIndex((c) => c.id === id);

      if (idx < 0) return workflowErr("NOT_FOUND");



      const existing = cards[idx];

      const updated: WorkflowCard = {

        ...existing,

        title: parsed.data.title !== undefined ? parsed.data.title.trim() : existing.title,

        status: parsed.data.status ?? existing.status,

        description: parsed.data.description !== undefined ? parsed.data.description : existing.description,

        notes: parsed.data.notes !== undefined ? parsed.data.notes : existing.notes,

        dueDate: parsed.data.dueDate !== undefined ? parsed.data.dueDate : existing.dueDate,

        order: parsed.data.order ?? existing.order,

        youtubeVideoId:

          parsed.data.youtubeVideoId !== undefined ? parsed.data.youtubeVideoId : existing.youtubeVideoId,

      };

      const next = [...cards];

      next[idx] = updated;

      saveWorkflowsToCookie(actorId, next);

      return { ok: true, data: { card: updated } };

    },

    (details) => workflowErr("DB_ERROR", details),

    "updateWorkflow"

  );

}



export async function deleteWorkflowAction(

  id: string

): Promise<WorkflowActionResult<{ deleted: true }>> {

  return safeRun<WorkflowActionResult<{ deleted: true }>>(

    async () => {

      const { actorId } = await resolveActor();

      const db = await getDbChannelContext();



      if (db) {

        const { data, error } = await db.supabase

          .from("workflows")

          .delete()

          .eq("id", id)

          .eq("channel_id", db.channelId)

          .select("id");



        if (!error && data?.length) return { ok: true, data: { deleted: true } };

      }



      const cards = getWorkflowsFromCookie(actorId);

      const next = cards.filter((c) => c.id !== id);

      if (next.length === cards.length) return workflowErr("NOT_FOUND");

      saveWorkflowsToCookie(actorId, next);

      return { ok: true, data: { deleted: true } };

    },

    (details) => workflowErr("DB_ERROR", details),

    "deleteWorkflow"

  );

}



export async function reorderWorkflowsAction(

  items: Array<{ id: string; status: WorkflowStatus; order: number }>

): Promise<WorkflowActionResult<{ updated: number }>> {

  return safeRun<WorkflowActionResult<{ updated: number }>>(

    async () => {

      const { actorId } = await resolveActor();

      const db = await getDbChannelContext();



      if (db) {

        let updated = 0;

        let dbFailed = false;

        for (const item of items) {

          const { error } = await db.supabase

            .from("workflows")

            .update({ status: item.status, order: item.order })

            .eq("id", item.id)

            .eq("channel_id", db.channelId);

          if (!error) updated += 1;

          else dbFailed = true;

        }

        if (!dbFailed) return { ok: true, data: { updated } };

      }



      const cards = getWorkflowsFromCookie(actorId);

      const byId = new Map(items.map((i) => [i.id, i]));

      let updated = 0;

      const next = cards.map((card) => {

        const patch = byId.get(card.id);

        if (!patch) return card;

        updated += 1;

        return { ...card, status: patch.status, order: patch.order };

      });

      saveWorkflowsToCookie(actorId, next);

      return { ok: true, data: { updated } };

    },

    (details) => workflowErr("DB_ERROR", details),

    "reorderWorkflows"

  );

}


