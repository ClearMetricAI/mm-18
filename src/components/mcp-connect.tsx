import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const MCP_ENDPOINT = "https://mcp.clearmetric.ai/org_contoso/v1";
export const MCP_KEY_MASKED = "cm_live_••••••••••••••••2f8a";
export const MCP_KEY_FULL = "cm_live_full_key_redacted";

export function EndpointRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div className="flex items-center gap-3 text-xs">
      <span className="w-20 shrink-0 text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <span className="flex-1 truncate font-mono text-foreground/90">{value}</span>
      <button
        onClick={onCopy}
        className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        title="Copy"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-[var(--success)]" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  );
}

const SNIPPETS: { id: string; label: string; code: string }[] = [
  {
    id: "claude",
    label: "Claude Desktop",
    code: `// ~/Library/Application Support/Claude/claude_desktop_config.json
{
  "mcpServers": {
    "clearmetric": {
      "url": "${MCP_ENDPOINT}",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "cursor",
    label: "Cursor",
    code: `// .cursor/mcp.json
{
  "mcpServers": {
    "clearmetric": {
      "url": "${MCP_ENDPOINT}",
      "headers": { "Authorization": "Bearer YOUR_API_KEY" }
    }
  }
}`,
  },
  {
    id: "openai",
    label: "OpenAI Agents",
    code: `from agents import Agent
from agents.mcp import MCPServerStreamableHttp

mcp = MCPServerStreamableHttp(
    url="${MCP_ENDPOINT}",
    headers={"Authorization": "Bearer YOUR_API_KEY"},
)

agent = Agent(name="analyst", mcp_servers=[mcp])`,
  },
  {
    id: "langchain",
    label: "LangChain",
    code: `from langchain_mcp_adapters.client import MultiServerMCPClient

client = MultiServerMCPClient({
    "clearmetric": {
        "url": "${MCP_ENDPOINT}",
        "transport": "streamable_http",
        "headers": {"Authorization": "Bearer YOUR_API_KEY"},
    }
})

tools = await client.get_tools()`,
  },
];

export function ConnectTabs({
  copied,
  copy,
}: {
  copied: string | null;
  copy: (k: string, t: string) => void;
}) {
  return (
    <Tabs defaultValue="claude">
      <TabsList className="h-8 bg-muted/40">
        {SNIPPETS.map((s) => (
          <TabsTrigger key={s.id} value={s.id} className="h-6 px-3 text-xs">
            {s.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {SNIPPETS.map((s) => {
        const key = `snip_${s.id}`;
        return (
          <TabsContent key={s.id} value={s.id} className="mt-2">
            <div className="relative overflow-hidden rounded border border-border bg-background">
              <button
                onClick={() => copy(key, s.code)}
                className="absolute right-2 top-2 z-10 rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Copy"
              >
                {copied === key ? (
                  <Check className="h-3.5 w-3.5 text-[var(--success)]" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </button>
              <pre className="overflow-x-auto p-3 pr-10 font-mono text-[11px] leading-relaxed text-foreground/90">
                {s.code}
              </pre>
            </div>
          </TabsContent>
        );
      })}
    </Tabs>
  );
}

export function McpConnectPanel() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-1.5 rounded-lg border border-border bg-muted/20 px-4 py-3">
        <EndpointRow
          label="Endpoint"
          value={MCP_ENDPOINT}
          copied={copied === "url"}
          onCopy={() => copy("url", MCP_ENDPOINT)}
        />
        <EndpointRow
          label="API key"
          value={MCP_KEY_MASKED}
          copied={copied === "key"}
          onCopy={() => copy("key", MCP_KEY_FULL)}
        />
      </div>
      <div>
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Connect your agent
          </span>
          <span className="text-xs text-muted-foreground">
            Paste into your agent config · one-time setup
          </span>
        </div>
        <ConnectTabs copied={copied} copy={copy} />
      </div>
    </div>
  );
}
