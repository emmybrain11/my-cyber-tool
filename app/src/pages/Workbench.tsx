import { useState, useRef } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";

export default function Workbench() {
  const [script, setScript] = useState("# Write your payload, scan command, or defensive script here\n");
  const [scriptOutput, setScriptOutput] = useState<string>("");
  const [repoUrl, setRepoUrl] = useState("https://github.com/");
  const [branch, setBranch] = useState("");
  const [targetDir, setTargetDir] = useState("my-repo");
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [toolArgs, setToolArgs] = useState("--help");
  const [toolRepoPath, setToolRepoPath] = useState<string>("");
  const [customCommand, setCustomCommand] = useState("python3 -m http.server 8000");
  const [toolOutput, setToolOutput] = useState<string>("");
  const [toolError, setToolError] = useState<string | null>(null);
  const [cloneOutput, setCloneOutput] = useState<string>("");
  const [cloneError, setCloneError] = useState<string | null>(null);
  const [targetHost, setTargetHost] = useState("http://example.com");
  const [targetEmail, setTargetEmail] = useState("security@example.com");
  const [targetUsername, setTargetUsername] = useState("exampleuser");
  const [targetPicture, setTargetPicture] = useState("/workspace/profile.jpg");
  const [targetFile, setTargetFile] = useState("/workspace/secret.txt");
  const [outputFile, setOutputFile] = useState("/workspace/secret.enc");
  const [passphrase, setPassphrase] = useState("mypassword");
  const [selectedPlaybook, setSelectedPlaybook] = useState<"offense" | "defense" | "malware" | "osint" | "crypto" | "stego">("offense");

  const playbookCommands = [
    {
      id: "web-recon",
      label: "Website Recon",
      category: "offense",
      command: `nmap -sV -p- ${targetHost}`,
      description: "Discover open web services and application versions.",
    },
    {
      id: "osint-email",
      label: "Email Harvest Recon",
      category: "osint",
      command: `theHarvester -d ${targetHost.replace(/https?:\/\//, "")} -b all -l 200 -e ${targetEmail}`,
      description: "Try to collect email addresses and employee names from public sources.",
    },
    {
      id: "osint-username",
      label: "Username Profile Search",
      category: "osint",
      command: `sherlock ${targetUsername}`,
      description: "Search for a username across hundreds of social sites.",
    },
    {
      id: "osint-metadata",
      label: "Image Metadata Analysis",
      category: "osint",
      command: `exiftool -a -u -g1 ${targetPicture}`,
      description: "Inspect profile picture metadata for location, device, and author data.",
    },
    {
      id: "osint-docs",
      label: "Document Metadata Harvest",
      category: "osint",
      command: `metagoofil -d ${targetHost.replace(/https?:\/\//, "")} -t pdf,doc,xls -l 50 -p /tmp/output`,
      description: "Extract embedded emails, usernames, and server names from public documents.",
    },
    {
      id: "crypto-encrypt-openssl",
      label: "Encrypt File (OpenSSL)",
      category: "crypto",
      command: `openssl enc -aes-256-cbc -salt -in ${targetFile} -out ${outputFile} -k ${passphrase}`,
      description: "Encrypt a file using AES-256-CBC with OpenSSL.",
    },
    {
      id: "crypto-decrypt-openssl",
      label: "Decrypt File (OpenSSL)",
      category: "crypto",
      command: `openssl enc -d -aes-256-cbc -in ${outputFile} -out ${targetFile}.dec -k ${passphrase}`,
      description: "Decrypt a file encrypted with OpenSSL.",
    },
    {
      id: "crypto-encrypt-gpg",
      label: "Encrypt File (GPG)",
      category: "crypto",
      command: `gpg --symmetric --cipher-algo AES256 --output ${outputFile}.gpg --passphrase ${passphrase} --batch ${targetFile}`,
      description: "Encrypt a file with GPG symmetric encryption.",
    },
    {
      id: "crypto-decrypt-gpg",
      label: "Decrypt File (GPG)",
      category: "crypto",
      command: `gpg --decrypt --passphrase ${passphrase} --batch --output ${targetFile}.dec ${outputFile}.gpg`,
      description: "Decrypt a GPG-encrypted file with the same passphrase.",
    },
    {
      id: "stego-embed",
      label: "Embed File into Image",
      category: "stego",
      command: `steghide embed -cf ${targetPicture} -ef ${targetFile} -sf /workspace/stego-out.jpg -p ${passphrase}`,
      description: "Hide a secret file inside an image using Steghide.",
    },
    {
      id: "stego-extract",
      label: "Extract Hidden File",
      category: "stego",
      command: `steghide extract -sf ${targetPicture} -xf /workspace/stego-extracted.txt -p ${passphrase}`,
      description: "Extract a hidden file from an image using Steghide.",
    },
    {
      id: "stego-scan",
      label: "Analyze Image for Hidden Data",
      category: "stego",
      command: `zsteg ${targetPicture}`,
      description: "Analyze an image for hidden content using Zsteg.",
    },
    {
      id: "web-vuln",
      label: "Web Vulnerability Scan",
      category: "offense",
      command: `nikto -h ${targetHost}`,
      description: "Scan the target website for common injection and configuration issues.",
    },
    {
      id: "sql-injection",
      label: "SQL Injection Test",
      category: "offense",
      command: `sqlmap -u '${targetHost}/page.php?id=1' --batch`,
      description: "Simulate SQL injection against a parameterized web endpoint.",
    },
    {
      id: "web-hardening",
      label: "Web Defense Hardening",
      category: "defense",
      command: `auditctl -w /var/www/html -p wa -k webwatch`,
      description: "Track changes to web content and detect suspicious modification.",
    },
    {
      id: "ids-setup",
      label: "Start IDS Monitoring",
      category: "defense",
      command: `suricata -c /etc/suricata/suricata.yaml -i eth0`,
      description: "Run Suricata for network-level detection of web-based attacks.",
    },
    {
      id: "malware-repo",
      label: "Clone Malware Lab Repo",
      category: "malware",
      command: "git clone https://github.com/ytisf/theZoo.git /workspace/theZoo",
      description: "Clone a malware sample repository into a sandbox for defensive analysis.",
    },
    {
      id: "malware-analysis",
      label: "Static Analysis",
      category: "malware",
      command: "strings /workspace/theZoo/samples/sample.exe | head",
      description: "Inspect a malware sample string table for indicators of compromise.",
    },
  ];

  const filteredPlaybookCommands = playbookCommands.filter((item) => item.category === selectedPlaybook);

  const toolsQuery = trpc.python.tools.useQuery();
  const cloneMutation = trpc.python.cloneRepo.useMutation({
    onSuccess: (data) => {
      setCloneError(null);
      setCloneOutput(`Command:\n${(data as any).command}\n\nstdout:\n${(data as any).stdout || "<no output>"}\n\nstderr:\n${(data as any).stderr || "<no errors>"}`);
    },
    onError: (err) => {
      setCloneError(err.message || "Clone failed.");
      setCloneOutput("");
    },
  });

  const runToolMutation = trpc.python.runTool.useMutation({
    onSuccess: (data) => {
      setToolError(null);
      setToolOutput(`Command:\n${(data as any).command}\n\nstdout:\n${(data as any).stdout || "<no output>"}\n\nstderr:\n${(data as any).stderr || "<no errors>"}`);
    },
    onError: (err) => {
      setToolError(err.message || "Tool execution failed.");
      setToolOutput("");
    },
  });

  const runMutation = trpc.tools.execScript.useMutation({
    onSuccess: (data) => {
      setScriptOutput(`Command:\n${data.command}\n\nstdout:\n${data.stdout || "<no output>"}\n\nstderr:\n${data.stderr || "<no errors>"}`);
    },
    onError: (err) => {
      setScriptOutput(err.message || "Command failed.");
    },
  });

  const runCustomCommandMutation = trpc.python.runCustomCommand.useMutation({
    onSuccess: (data) => {
      setToolError(null);
      setToolOutput(`Command:\n${(data as any).command}\n\nstdout:\n${(data as any).stdout || "<no output>"}\n\nstderr:\n${(data as any).stderr || "<no errors>"}`);
    },
    onError: (err) => {
      setToolError(err.message || "Custom command failed.");
      setToolOutput("");
    },
  });

  const wsRef = useRef<WebSocket | null>(null);

  async function streamCommand(payload: Record<string, any>, append: (s: string) => void, onFinish?: (code: number | null) => void) {
    const tryPaths = ["/pyapi/ws/run", "/ws/run"];
    let ws: WebSocket | null = null;
    for (const p of tryPaths) {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const url = p.startsWith("http") ? p : `${protocol}//${host}${p}`;
        ws = new WebSocket(url);
        await new Promise<void>((resolve, reject) => {
          const t = setTimeout(() => reject(new Error("timeout")), 3000);
          ws!.onopen = () => {
            clearTimeout(t);
            resolve();
          };
          ws!.onerror = () => {
            clearTimeout(t);
            reject(new Error("ws error"));
          };
        });
        break;
      } catch (e) {
        if (ws) {
          try { ws.close(); } catch {};
        }
        ws = null;
        continue;
      }
    }
    if (!ws) {
      throw new Error("Unable to open WebSocket to backend");
    }
    wsRef.current = ws;

    ws.onmessage = (ev) => {
      try {
        const data = JSON.parse(ev.data as string);
        if (data.type === "stdout") {
          append(data.line + "\n");
        } else if (data.type === "error") {
          append(`Error: ${data.message}\n`);
        } else if (data.type === "exit") {
          append(`[exit ${data.exit_code}]\n`);
          if (onFinish) onFinish(data.exit_code);
          try { ws.close(); } catch {};
        }
      } catch (e) {
        append(String(ev.data) + "\n");
      }
    };

    ws.onclose = () => {
      wsRef.current = null;
    };

    ws.onerror = () => {
      append("WebSocket error\n");
    };

    ws.send(JSON.stringify(payload));
  }

  const isRunPending = runMutation.status === "pending";
  const isClonePending = cloneMutation.status === "pending";
  const isRunToolPending = runToolMutation.status === "pending";
  const isRunCustomPending = runCustomCommandMutation.status === "pending";

  const toolList = toolsQuery.data as Array<{ name: string; description: string; command: string }> | undefined;
  const currentTool = toolList?.find((tool) => tool.name === selectedTool);

  return (
    <main className="p-8 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Security Workbench</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Write live scripts, clone repositories, and execute lab tools in a controlled cybersecurity environment.
          </p>
        </section>

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-7 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Payload / Script Editor</h2>
              <textarea
                value={script}
                onChange={(event) => setScript(event.target.value)}
                className="h-[240px] w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none"
              />
              <div className="mt-4 flex items-center gap-3 flex-wrap">
                <Button
                  onClick={() => {
                    setScriptOutput("");
                    (async () => {
                      try {
                        setScriptOutput((s) => s + `> ${script}\n`);
                        await streamCommand({ command: script }, (line) => setScriptOutput((s) => s + line,));
                      } catch (err: any) {
                        setScriptOutput((s) => s + `Error: ${err?.message || String(err)}\n`);
                      }
                    })();
                  }}
                >
                  Execute Script
                </Button>
                <span className="text-xs text-[var(--text-muted)]">
                  Script execution is controlled by `ALLOW_SCRIPT_EXECUTION=1` in the environment.
                </span>
              </div>
              <div className="mt-4 rounded-2xl bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-wrap min-h-[120px]">
                {scriptOutput || "Script execution output will appear here."}
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Clone Repository</h2>
              <div className="grid gap-3">
                <input
                  value={repoUrl}
                  onChange={(event) => setRepoUrl(event.target.value)}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  placeholder="Repository URL"
                />
                <input
                  value={branch}
                  onChange={(event) => setBranch(event.target.value)}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  placeholder="Branch (optional)"
                />
                <input
                  value={targetDir}
                  onChange={(event) => setTargetDir(event.target.value)}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  placeholder="Target directory"
                />
                <Button
                  onClick={() => cloneMutation.mutate({ repoUrl, branch: branch || undefined, targetDir: targetDir || undefined })}
                  disabled={isClonePending}
                >
                  {isClonePending ? "Cloning..." : "Clone Repository"}
                </Button>
                {cloneError ? <div className="text-sm text-[var(--text-danger)]">{cloneError}</div> : null}
                <div className="rounded-2xl bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-wrap min-h-[120px]">
                  {cloneOutput || "Clone output will appear here."}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Attack & Defense Playbook</h2>
              <div className="grid gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  {(["offense", "defense", "malware", "osint", "crypto", "stego"] as const).map((type) => (
                    <Button
                      key={type}
                      variant={selectedPlaybook === type ? "secondary" : "outline"}
                      onClick={() => setSelectedPlaybook(type)}
                    >
                      {type === "offense"
                        ? "Offense"
                        : type === "defense"
                        ? "Defense"
                        : type === "malware"
                        ? "Malware Lab"
                        : type === "osint"
                        ? "OSINT"
                        : type === "crypto"
                        ? "Crypto"
                        : "Stego"}
                    </Button>
                  ))}
                </div>
                <div className="grid gap-3">
                  <input
                    value={targetHost}
                    onChange={(event) => setTargetHost(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Target website or host"
                  />
                  <input
                    value={targetEmail}
                    onChange={(event) => setTargetEmail(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Target email address"
                  />
                  <input
                    value={targetUsername}
                    onChange={(event) => setTargetUsername(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Target username"
                  />
                  <input
                    value={targetPicture}
                    onChange={(event) => setTargetPicture(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Target picture path in workspace"
                  />
                  <input
                    value={targetFile}
                    onChange={(event) => setTargetFile(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="File to encrypt/decrypt"
                  />
                  <input
                    value={outputFile}
                    onChange={(event) => setOutputFile(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Output file path"
                  />
                  <input
                    value={passphrase}
                    onChange={(event) => setPassphrase(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Passphrase"
                    type="password"
                  />
                </div>
                {filteredPlaybookCommands.map((item) => (
                  <div key={item.id} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold">{item.label}</p>
                        <p className="text-xs text-[var(--text-muted)]">{item.description}</p>
                      </div>
                      <Button
                        onClick={() => setScript(item.command)}
                        size="sm"
                      >
                        Load Command
                      </Button>
                    </div>
                    <pre className="mt-3 text-[var(--text-secondary)] whitespace-pre-wrap">{item.command}</pre>
                  </div>
                ))}
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-muted)]">
                  <p className="font-semibold mb-2">How to use</p>
                  <p>Pick an offense, defense, malware lab, or OSINT workflow. Load the command to the editor and customize it with email, username, profile picture path, or domain target.</p>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Tool Runner</h2>
              <div className="grid gap-3">
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                  <div className="mb-3 text-sm text-[var(--text-muted)]">Available tools are loaded from the Python service. Select one to customize args or repo path.</div>
                  <select
                    value={selectedTool}
                    onChange={(event) => setSelectedTool(event.target.value)}
                    className="w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  >
                    <option value="">Select a tool</option>
                    {toolList?.map((tool) => (
                      <option key={tool.name} value={tool.name}>
                        {tool.name}
                      </option>
                    ))}
                  </select>
                  {currentTool ? (
                    <div className="mt-3 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
                      <p className="font-semibold">{currentTool.name}</p>
                      <p>{currentTool.description}</p>
                      <pre className="mt-2 whitespace-pre-wrap">{currentTool.command}</pre>
                    </div>
                  ) : null}
                </div>
                <input
                  value={toolArgs}
                  onChange={(event) => setToolArgs(event.target.value)}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  placeholder="Tool args (use variables if supported)"
                />
                <input
                  value={toolRepoPath}
                  onChange={(event) => setToolRepoPath(event.target.value)}
                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  placeholder="Repository path within workspace (optional)"
                />
                <Button
                  onClick={() => {
                    if (!selectedTool) return;
                    setToolOutput("");
                    (async () => {
                      try {
                        setToolOutput((s) => s + `> ${currentTool?.command}\n`);
                        await streamCommand({ tool: selectedTool, args: toolArgs, repo_path: toolRepoPath || undefined }, (line) => setToolOutput((s) => s + line));
                      } catch (err: any) {
                        setToolOutput((s) => s + `Error: ${err?.message || String(err)}\n`);
                      }
                    })();
                  }}
                  disabled={!selectedTool}
                >
                  Run Selected Tool
                </Button>
                <div className="rounded-2xl bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-secondary)] whitespace-pre-wrap min-h-[120px]">
                  {toolOutput || "Tool execution output will appear here."}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Custom Command</h2>
              <div className="grid gap-3">
                <textarea
                  value={customCommand}
                  onChange={(event) => setCustomCommand(event.target.value)}
                  className="h-[120px] w-full resize-none rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-primary)] outline-none"
                  placeholder="Enter a custom command to run through the Python service"
                />
                <Button
                  onClick={() => {
                    setToolOutput("");
                    (async () => {
                      try {
                        setToolOutput((s) => s + `> ${customCommand}\n`);
                        await streamCommand({ command: customCommand, repo_path: toolRepoPath || undefined }, (line) => setToolOutput((s) => s + line));
                      } catch (err: any) {
                        setToolOutput((s) => s + `Error: ${err?.message || String(err)}\n`);
                      }
                    })();
                  }}
                >
                  Run Custom Command
                </Button>
                {toolError ? <div className="text-sm text-[var(--text-danger)]">{toolError}</div> : null}
              </div>
            </div>
          </div>

          <div className="col-span-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Command Output</h2>
              <div className="min-h-[380px] rounded-2xl bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-primary)] overflow-auto whitespace-pre-wrap">
                {toolError ? `Error: ${toolError}` : toolOutput || cloneOutput || "Select a tool or clone a repository to see output here."}
              </div>
            </div>
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
              <h2 className="text-xl font-semibold mb-4">Tool Catalog</h2>
              <div className="space-y-3 text-sm text-[var(--text-muted)]">
                {toolsQuery.isLoading && <div>Loading available Python tools...</div>}
                {toolsQuery.error && <div className="text-[var(--text-danger)]">{toolsQuery.error.message}</div>}
                {toolList?.map((tool) => (
                  <div key={tool.name} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                    <p className="font-semibold">{tool.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{tool.description}</p>
                    <pre className="mt-2 text-[var(--text-secondary)] whitespace-pre-wrap">{tool.command}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
