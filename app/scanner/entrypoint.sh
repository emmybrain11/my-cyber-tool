#!/bin/sh
# Prevent accidental scans. Require ALLOW_SCANS=1 or the presence of /authorized inside the container.
if [ "$ALLOW_SCANS" != "1" ] && [ ! -f /authorized ]; then
  echo "Scanner disabled. Set ALLOW_SCANS=1 or create /authorized to enable scans."
  exit 1
fi

# If arguments are provided, run them as the scan command, otherwise open a shell
if [ "$#" -gt 0 ]; then
  exec "$@"
else
  exec /bin/bash
fi
