import { useMemo, useState } from "react";
import { trpc } from "@/providers/trpc";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type Tool = {
  name: string;
  description: string;
  command: string;
  category: string;
};

export default function CryptoStego() {
  const [selectedTool, setSelectedTool] = useState<string>("");
  const [secretFile, setSecretFile] = useState<string>("/workspace/secret.txt");
  const [outputFile, setOutputFile] = useState<string>("/workspace/secret.enc");
  const [carrierFile, setCarrierFile] = useState<string>("/workspace/cover.jpg");
  const [passphrase, setPassphrase] = useState<string>("mypassword");
  const [customCommand, setCustomCommand] = useState<string>("openssl enc -aes-256-cbc -salt -in /workspace/secret.txt -out /workspace/secret.enc -k mypassword");
  const [output, setOutput] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const toolsQuery = trpc.python.tools.useQuery();

  const runCustomCommandMutation = trpc.python.runCustomCommand.useMutation({
    onSuccess: (data) => {
      setError(null);
      setOutput(`Command:\n${(data as any).command}\n\nstdout:\n${(data as any).stdout || "<no output>"}\n\nstderr:\n${(data as any).stderr || "<no errors>"}`);
    },
    onError: (err) => {
      setError(err.message || "Custom command failed.");
      setOutput("");
    },
  });

  const availableTools = useMemo(() => {
    const tools = toolsQuery.data as Tool[] | undefined;
    return tools?.filter((tool) => tool.category === "crypto" || tool.category === "stego") ?? [];
  }, [toolsQuery.data]);

  const currentTool = availableTools.find((tool) => tool.name === selectedTool);

  const buildExampleCommand = (tool: Tool) => {
    if (tool.name === "openssl") {
      return `openssl enc -aes-256-cbc -salt -in ${secretFile} -out ${outputFile} -k ${passphrase}`;
    }
    if (tool.name === "gpg") {
      return `gpg --symmetric --cipher-algo AES256 --output ${outputFile}.gpg --passphrase ${passphrase} --batch ${secretFile}`;
    }
    if (tool.name === "steghide") {
      return `steghide embed -cf ${carrierFile} -ef ${secretFile} -sf /workspace/stego-out.jpg -p ${passphrase}`;
    }
    if (tool.name === "zsteg") {
      return `zsteg ${carrierFile}`;
    }
    if (tool.name === "binwalk") {
      return `binwalk -e ${carrierFile}`;
    }
    return tool.command;
  };

  return (
    <main className="p-8 min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <div className="max-w-6xl mx-auto space-y-8">
        <section className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 shadow-lg">
          <h1 className="text-3xl font-semibold">Crypto & Stego Lab</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            Execute real encryption and steganography tools in a lab environment. Encrypt, decrypt, hide, extract, and analyze files with working CLI commands.
          </p>
        </section>

        <section className="grid grid-cols-12 gap-6">
          <div className="col-span-7 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Quick Tool Launcher</h2>
              <div className="grid gap-3">
                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Tool</label>
                  <select
                    value={selectedTool}
                    onChange={(event) => {
                      setSelectedTool(event.target.value);
                      const tool = availableTools.find((item) => item.name === event.target.value);
                      if (tool) {
                        setCustomCommand(buildExampleCommand(tool));
                      }
                    }}
                    className="mt-2 w-full rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                  >
                    <option value="">Select crypto/stego tool</option>
                    {availableTools.map((tool) => (
                      <option key={tool.name} value={tool.name}>
                        {tool.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={secretFile}
                    onChange={(event) => setSecretFile(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Secret file path"
                  />
                  <input
                    value={outputFile}
                    onChange={(event) => setOutputFile(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Output file path"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={carrierFile}
                    onChange={(event) => setCarrierFile(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Carrier image file"
                  />
                  <input
                    type="password"
                    value={passphrase}
                    onChange={(event) => setPassphrase(event.target.value)}
                    className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-3 text-[var(--text-primary)] outline-none"
                    placeholder="Passphrase"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-[var(--text-primary)]">Command</label>
                  <Textarea
                    value={customCommand}
                    onChange={(event) => setCustomCommand(event.target.value)}
                    rows={5}
                    className="mt-2 bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => runCustomCommandMutation.mutate({ command: customCommand })}
                    disabled={runCustomCommandMutation.status === "pending"}
                  >
                    {runCustomCommandMutation.status === "pending" ? "Running..." : "Run Command"}
                  </Button>
                  {currentTool ? (
                    <Button
                      variant="outline"
                      onClick={() => setCustomCommand(buildExampleCommand(currentTool))}
                    >
                      Load Example
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Tool Reference</h2>
              <div className="space-y-3 text-sm text-[var(--text-muted)]">
                {toolsQuery.isLoading && <div>Loading available crypto/stego tools...</div>}
                {toolsQuery.error && <div className="text-[var(--text-danger)]">{toolsQuery.error.message}</div>}
                {availableTools.map((tool) => (
                  <div key={tool.name} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-4">
                    <p className="font-semibold">{tool.name}</p>
                    <p className="text-xs text-[var(--text-muted)]">{tool.description}</p>
                    <pre className="mt-2 text-[var(--text-secondary)] whitespace-pre-wrap">{tool.command}</pre>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-5 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Command Output</h2>
              <div className="min-h-[380px] rounded-2xl bg-[var(--bg-primary)] p-4 font-mono text-sm leading-6 text-[var(--text-primary)] overflow-auto whitespace-pre-wrap">
                {error ? `Error: ${error}` : output || "Execute a real crypto or stego command to see output here."}
              </div>
            </div>

            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
              <h2 className="text-xl font-semibold mb-4">Real World Usage</h2>
              <ul className="space-y-3 text-sm text-[var(--text-muted)]">
                <li>
                  <strong>OpenSSL AES-256:</strong> encrypt files with `openssl enc -aes-256-cbc -salt` and decrypt with `openssl enc -d`.
                </li>
                <li>
                  <strong>GPG symmetric:</strong> encrypt files using a passphrase with `gpg --symmetric --cipher-algo AES256`.
                </li>
                <li>
                  <strong>Steghide:</strong> hide secret files inside images and extract them again with the same passphrase.
                </li>
                <li>
                  <strong>Zsteg / Binwalk:</strong> inspect carrier images for hidden payloads and extract embedded content.
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
