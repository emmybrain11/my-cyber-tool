Safety and Usage Checklist — Emmy Brain Tool

IMPORTANT: This project includes offensive-security tooling (network scanners). Before enabling or running any scanner, follow the checklist below and obtain written authorization from your lab/network owner.

Minimum requirements and controls
- Only run scans inside an isolated lab network with explicit written approval.
- Never run scanners against third-party or production networks without authorization.
- Run scanners inside containers or VMs with restricted network access.
- Do not publish scanner containers to the public internet; do not expose scanner ports.
- Keep keys and credentials out of source control. Use environment variables or a secrets manager.
- Require an operator to consciously enable scans via environment variable `ALLOW_SCANS=1` or by placing an `/authorized` file inside the scanner container.
- Log all scan jobs and store logs in a controlled location with restricted access.

Recommended operational steps
1. Create an isolated lab VLAN / network segment for testing.
2. Deploy the application and scanner containers into that network only.
3. Use `docker-compose` with the provided `docker-compose.yml`. Do not expose the scanner service.
4. Require two-person approval to perform offensive tests on shared networks.
5. Keep an incident response and rollback plan ready.

If you are unsure about the legality or policy compliance of a scan, stop and consult your supervisor or legal counsel.
