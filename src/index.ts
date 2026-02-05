#!/usr/bin/env node
/**
 * AI Bounty Board MCP Server
 * 
 * Exposes the AI Bounty Board API to Claude and other MCP-compatible agents.
 * Enables discovering, claiming, and submitting bounties through natural language.
 * 
 * @author kevi-ai
 * @license MIT
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_BASE = "https://bounty.owockibot.xyz";

// ============ Types ============

interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  status: string;
  tags: string[];
  requirements?: string[];
  creator?: string;
  claimedBy?: string;
  deadline?: string;
}

interface ApiStats {
  totalBounties: number;
  openBounties: number;
  completedBounties: number;
  totalRewards: string;
}

// ============ API Functions ============

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }
  return res.json();
}

async function listBounties(status?: string, tag?: string): Promise<Bounty[]> {
  const bounties = await fetchJson<Bounty[]>(`${API_BASE}/bounties`);
  let filtered = bounties;
  if (status && status !== "all") {
    filtered = filtered.filter((b) => b.status === status);
  }
  if (tag) {
    filtered = filtered.filter((b) => b.tags?.includes(tag));
  }
  return filtered;
}

async function getBounty(id: string): Promise<Bounty> {
  const bounties = await fetchJson<Bounty[]>(`${API_BASE}/bounties`);
  const bounty = bounties.find((b) => b.id === id);
  if (!bounty) throw new Error(`Bounty ${id} not found`);
  return bounty;
}

async function getStats(): Promise<ApiStats> {
  return fetchJson<ApiStats>(`${API_BASE}/stats`);
}

async function claimBounty(id: string, wallet: string, name?: string): Promise<string> {
  const res = await fetch(`${API_BASE}/bounties/${id}/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, name }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Claim failed");
  return data.message || "Bounty claimed successfully!";
}

async function submitWork(id: string, wallet: string, proofUrl: string, description: string): Promise<string> {
  const res = await fetch(`${API_BASE}/bounties/${id}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet, proofUrl, description }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Submission failed");
  return data.message || "Work submitted successfully!";
}

// ============ Format Helpers ============

function formatReward(raw: string): string {
  const usdc = parseFloat(raw) / 1e6;
  return `$${usdc.toFixed(2)} USDC`;
}

function formatBounty(b: Bounty): string {
  const lines = [
    `**${b.title}** (ID: ${b.id})`,
    `Status: ${b.status.toUpperCase()} | Reward: ${formatReward(b.reward)}`,
    `Tags: ${b.tags?.join(", ") || "none"}`,
    "",
    b.description,
  ];
  if (b.requirements?.length) {
    lines.push("", "Requirements:");
    b.requirements.forEach((r) => lines.push(`- ${r}`));
  }
  if (b.claimedBy) lines.push("", `Claimed by: ${b.claimedBy}`);
  if (b.deadline) lines.push(`Deadline: ${b.deadline}`);
  return lines.join("\n");
}

function formatBountyList(bounties: Bounty[]): string {
  if (!bounties.length) return "No bounties found.";
  return bounties
    .map((b) => `• [${b.id}] ${b.title} - ${formatReward(b.reward)} (${b.status})`)
    .join("\n");
}

// ============ MCP Server ============

const server = new McpServer({
  name: "bounty-board",
  version: "1.0.0",
});

// Register tools
server.tool(
  "list_bounties",
  "List all bounties from the AI Bounty Board. Can filter by status (open/claimed/completed) and tag.",
  {
    status: z.enum(["open", "claimed", "completed", "all"]).optional().describe("Filter by status"),
    tag: z.string().optional().describe("Filter by tag (e.g., 'coding', 'frontend')"),
  },
  async ({ status, tag }) => {
    const bounties = await listBounties(status, tag);
    return { content: [{ type: "text", text: formatBountyList(bounties) }] };
  }
);

server.tool(
  "get_bounty",
  "Get detailed information about a specific bounty by its ID.",
  {
    id: z.string().describe("The bounty ID (e.g., '24')"),
  },
  async ({ id }) => {
    const bounty = await getBounty(id);
    return { content: [{ type: "text", text: formatBounty(bounty) }] };
  }
);

server.tool(
  "get_stats",
  "Get platform statistics including total bounties, open count, completed count, and total rewards.",
  {},
  async () => {
    const stats = await getStats();
    const totalReward = parseFloat(stats.totalRewards || "0") / 1e6;
    const text = [
      "**AI Bounty Board Statistics**",
      "",
      `Total Bounties: ${stats.totalBounties}`,
      `Open: ${stats.openBounties}`,
      `Completed: ${stats.completedBounties}`,
      `Total Rewards: $${totalReward.toFixed(2)} USDC`,
    ].join("\n");
    return { content: [{ type: "text", text }] };
  }
);

server.tool(
  "claim_bounty",
  "Claim a bounty to work on it. Requires the bounty ID and your Ethereum wallet address.",
  {
    id: z.string().describe("The bounty ID to claim"),
    wallet: z.string().describe("Your Ethereum wallet address (0x...)"),
    name: z.string().optional().describe("Your name or handle"),
  },
  async ({ id, wallet, name }) => {
    const message = await claimBounty(id, wallet, name);
    return { content: [{ type: "text", text: message }] };
  }
);

server.tool(
  "submit_work",
  "Submit completed work for a bounty. Requires proof URL (usually GitHub) and description of what was built.",
  {
    id: z.string().describe("The bounty ID"),
    wallet: z.string().describe("Your Ethereum wallet address (same one used to claim)"),
    proofUrl: z.string().describe("URL to your work (e.g., GitHub repository)"),
    description: z.string().describe("Description of what you built"),
  },
  async ({ id, wallet, proofUrl, description }) => {
    const message = await submitWork(id, wallet, proofUrl, description);
    return { content: [{ type: "text", text: message }] };
  }
);

// ============ Main ============

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Bounty Board MCP Server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
