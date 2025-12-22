--
-- PostgreSQL database dump
--

-- Dumped from database version 15.13
-- Dumped by pg_dump version 15.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: cot_reports; Type: TABLE DATA; Schema: public; Owner: cot_user
--

COPY public.cot_reports (id, market_id, report_date, publish_date, commercial_long, commercial_short, commercial_spreading, num_commercial_long, num_commercial_short, non_commercial_long, non_commercial_short, non_commercial_spreading, num_non_commercial_long, num_non_commercial_short, non_reportable_long, non_reportable_short, num_non_reportable_long, num_non_reportable_short, commercial_long_change, commercial_short_change, non_commercial_long_change, non_commercial_short_change, open_interest, swap_dealers_long, swap_dealers_short, managed_money_long, managed_money_short, other_reportable_long, other_reportable_short, source, data_quality_score, created_at, updated_at) FROM stdin;
\.


--
-- Name: cot_reports_id_seq; Type: SEQUENCE SET; Schema: public; Owner: cot_user
--

SELECT pg_catalog.setval('public.cot_reports_id_seq', 233894, true);


--
-- PostgreSQL database dump complete
--

