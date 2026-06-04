-- 2026-06-04 — Optional phone / WhatsApp number on clients.
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
-- Surfaced in the coach roster's "About" block with a wa.me click-to-WhatsApp
-- link, because Sam's primary client comms channel is WhatsApp — having the
-- number one click away beats hopping into another tool. Populated either by
-- the Stripe webhook (if checkout collected a phone) or by the coach in the
-- Add-client modal / roster row. Safe to re-run.

alter table public.clients
  add column if not exists phone text;

comment on column public.clients.phone is
  'Optional phone / WhatsApp number for the client. Surfaced in the roster About block as a click-to-WhatsApp link. Populated by Stripe (customer_details.phone) or set by the coach.';
