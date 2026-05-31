import { getDb } from "../api/queries/connection";
import {
  scanResults,
  cyberRangeLogs,
  defenseActivity,
  systemHealth,
  reports,
} from "./schema";

async function seed() {
  const db = getDb();
  console.log("Seeding database...");

  // Seed scan results
  const scans = [
    { module: "recon", target: "192.168.1.0/24", status: "completed" as const, findings: JSON.stringify([{ type: "host", count: 4271 }, { type: "port", count: 12847 }]), summary: "Network reconnaissance scan completed. 4,271 hosts discovered, 12,847 ports analyzed.", duration: 272, startedAt: new Date(Date.now() - 3600000), completedAt: new Date(Date.now() - 3328000) },
    { module: "audit", target: "web-server-01.internal", status: "completed" as const, findings: JSON.stringify([{ severity: "medium", issue: "Outdated TLS 1.1 supported" }, { severity: "low", issue: "Missing security headers" }]), summary: "Web server audit found 2 medium and 3 low severity issues.", duration: 189, startedAt: new Date(Date.now() - 7200000), completedAt: new Date(Date.now() - 7011000) },
    { module: "defense", target: "firewall-edge-01", status: "running" as const, findings: JSON.stringify([{ type: "rule", action: "block", count: 1247 }]), summary: "Active defense monitoring in progress.", duration: null, startedAt: new Date(Date.now() - 1800000), completedAt: null },
    { module: "cyber_range", target: "scenario-red-team-01", status: "completed" as const, findings: JSON.stringify([{ phase: "initial_access", success: true }, { phase: "lateral_movement", success: false }]), summary: "Red team exercise completed. 2 of 4 MITRE techniques successfully executed.", duration: 4523, startedAt: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 81877000) },
    { module: "synthesis", target: "ollama-local", status: "completed" as const, findings: JSON.stringify([{ model: "llama3.1:8b", tokens: 4521, analysis: "Threat intelligence synthesis complete" }]), summary: "AI-powered threat synthesis generated 3 actionable intelligence reports.", duration: 45, startedAt: new Date(Date.now() - 14400000), completedAt: new Date(Date.now() - 14399000) },
    { module: "recon", target: "10.0.0.0/16", status: "pending" as const, findings: null, summary: null, duration: null, startedAt: null, completedAt: null },
    { module: "audit", target: "db-cluster-02", status: "completed" as const, findings: JSON.stringify([{ severity: "critical", issue: "Unpatched CVE-2024-1234" }, { severity: "high", issue: "Weak password policy" }]), summary: "Database audit found 1 critical vulnerability requiring immediate attention.", duration: 312, startedAt: new Date(Date.now() - 10800000), completedAt: new Date(Date.now() - 10488000) },
    { module: "defense", target: "siem-central", status: "running" as const, findings: JSON.stringify([{ alert: "Brute force detected", count: 23 }]), summary: "SIEM correlation rules actively monitoring.", duration: null, startedAt: new Date(Date.now() - 3600000), completedAt: null },
    { module: "cyber_range", target: "scenario-blue-team-02", status: "completed" as const, findings: JSON.stringify([{ phase: "detection", time: "12s" }, { phase: "containment", time: "45s" }]), summary: "Blue team response exercise. Average detection time: 12s, containment: 45s.", duration: 1890, startedAt: new Date(Date.now() - 172800000), completedAt: new Date(Date.now() - 170910000) },
    { module: "synthesis", target: "ollama-local", status: "running" as const, findings: null, summary: null, duration: null, startedAt: new Date(Date.now() - 300000), completedAt: null },
    { module: "recon", target: "external-perimeter", status: "completed" as const, findings: JSON.stringify([{ type: "subdomain", count: 142 }, { type: "service", count: 89 }]), summary: "External perimeter scan found 142 subdomains and 89 exposed services.", duration: 567, startedAt: new Date(Date.now() - 5400000), completedAt: new Date(Date.now() - 5133000) },
    { module: "audit", target: "k8s-cluster-prod", status: "completed" as const, findings: JSON.stringify([{ severity: "high", issue: "Privileged container detected" }, { severity: "medium", issue: "RBAC misconfiguration" }]), summary: "Kubernetes security audit found 1 high and 2 medium severity issues.", duration: 423, startedAt: new Date(Date.now() - 9000000), completedAt: new Date(Date.now() - 8577000) },
  ];

  for (const scan of scans) {
    await db.insert(scanResults).values(scan);
  }
  console.log(`Inserted ${scans.length} scan results`);

  // Seed cyber range logs
  const rangeLogs = [
    { scenario: "Red Team: APT Simulation", action: "started" as const, details: JSON.stringify({ team: "red", objective: "Data exfiltration" }) },
    { scenario: "Red Team: APT Simulation", action: "checkpoint" as const, details: JSON.stringify({ phase: "initial_access", technique: "T1566.001", status: "success" }) },
    { scenario: "Red Team: APT Simulation", action: "checkpoint" as const, details: JSON.stringify({ phase: "persistence", technique: "T1547.001", status: "success" }) },
    { scenario: "Red Team: APT Simulation", action: "checkpoint" as const, details: JSON.stringify({ phase: "lateral_movement", technique: "T1021.002", status: "blocked" }) },
    { scenario: "Red Team: APT Simulation", action: "completed" as const, details: JSON.stringify({ score: 65, techniques: ["T1566.001", "T1547.001"], blocked: ["T1021.002", "T1041"] }) },
    { scenario: "Blue Team: Incident Response", action: "started" as const, details: JSON.stringify({ team: "blue", inject: "Ransomware outbreak" }) },
    { scenario: "Blue Team: Incident Response", action: "checkpoint" as const, details: JSON.stringify({ phase: "detection", time_seconds: 12, alert_triggered: "sigma-ransomware-001" }) },
    { scenario: "Blue Team: Incident Response", action: "completed" as const, details: JSON.stringify({ detection_time: 12, containment_time: 45, eradication_time: 180, score: 92 }) },
  ];

  for (const log of rangeLogs) {
    await db.insert(cyberRangeLogs).values(log);
  }
  console.log(`Inserted ${rangeLogs.length} cyber range logs`);

  // Seed defense activity
  const defenseEvents = [
    { eventType: "block" as const, description: "SQL injection attempt blocked", source: "203.0.113.45", target: "web-server-01", severity: "high" as const, mitreTechnique: "T1190", status: "active" as const },
    { eventType: "alert" as const, description: "Brute force login detected", source: "198.51.100.22", target: "auth-service", severity: "medium" as const, mitreTechnique: "T1110", status: "active" as const },
    { eventType: "quarantine" as const, description: "Malware signature match", source: "endpoint-892", target: "C2 server", severity: "critical" as const, mitreTechnique: "T1204.002", status: "resolved" as const },
    { eventType: "monitor" as const, description: "Port scan detected", source: "10.0.0.55", target: "subnet-12", severity: "low" as const, mitreTechnique: "T1046", status: "active" as const },
    { eventType: "mitigate" as const, description: "DDoS mitigation triggered", source: "CDN edge", target: "origin", severity: "high" as const, mitreTechnique: "T1498", status: "resolved" as const },
    { eventType: "block" as const, description: "Cross-site scripting attempt blocked", source: "185.220.101.33", target: "app-server-03", severity: "medium" as const, mitreTechnique: "T1189", status: "active" as const },
    { eventType: "alert" as const, description: "Suspicious PowerShell execution", source: "endpoint-445", target: "local system", severity: "high" as const, mitreTechnique: "T1059.001", status: "active" as const },
    { eventType: "quarantine" as const, description: "C2 beaconing detected", source: "endpoint-223", target: "45.142.214.89", severity: "critical" as const, mitreTechnique: "T1071.001", status: "resolved" as const },
    { eventType: "block" as const, description: "Directory traversal attempt", source: "192.0.2.78", target: "file-server-02", severity: "medium" as const, mitreTechnique: "T1083", status: "active" as const },
    { eventType: "monitor" as const, description: "Unusual data transfer volume", source: "workstation-567", target: "external-cloud", severity: "low" as const, mitreTechnique: "T1048", status: "active" as const },
  ];

  for (const event of defenseEvents) {
    await db.insert(defenseActivity).values(event);
  }
  console.log(`Inserted ${defenseEvents.length} defense events`);

  // Seed system health metrics
  const healthMetrics = [
    { metric: "total_assets", value: "4271.00", status: "healthy" as const },
    { metric: "network_uptime", value: "99.70", status: "healthy" as const },
    { metric: "ids_coverage", value: "94.20", status: "healthy" as const },
    { metric: "patch_compliance", value: "87.50", status: "degraded" as const },
    { metric: "firewall", value: "100.00", status: "healthy" as const },
    { metric: "ids", value: "100.00", status: "healthy" as const },
    { metric: "waf", value: "78.00", status: "degraded" as const },
    { metric: "edr", value: "100.00", status: "healthy" as const },
    { metric: "blocked_ips", value: "1247.00", status: "healthy" as const },
    { metric: "mitre_techniques", value: "31.00", status: "healthy" as const },
    { metric: "agents_online", value: "892.00", status: "healthy" as const },
    { metric: "siem_alerts", value: "23.00", status: "healthy" as const },
    { metric: "response_time", value: "1.20", status: "healthy" as const },
  ];

  for (const metric of healthMetrics) {
    await db.insert(systemHealth).values(metric);
  }
  console.log(`Inserted ${healthMetrics.length} health metrics`);

  // Seed sample reports
  const sampleReports = [
    { userId: 1, name: "Weekly Security Summary - May 2026", moduleFilter: "all", scanCount: 12, logCount: 8, defenseCount: 10, fileUrl: "/api/reports/download/1" },
    { userId: 1, name: "Red Team Exercise Report", moduleFilter: "cyber_range", scanCount: 0, logCount: 5, defenseCount: 0, fileUrl: "/api/reports/download/2" },
  ];

  for (const report of sampleReports) {
    await db.insert(reports).values(report);
  }
  console.log(`Inserted ${sampleReports.length} reports`);

  console.log("Seed complete!");
}

seed().catch(console.error);
