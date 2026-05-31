FROM ubuntu:24.04

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    nmap \
    masscan \
    iproute2 \
    iputils-ping \
  && rm -rf /var/lib/apt/lists/*

COPY entrypoint.sh /scanner/entrypoint.sh
RUN chmod +x /scanner/entrypoint.sh
WORKDIR /scanner
ENTRYPOINT ["/scanner/entrypoint.sh"]
CMD ["/bin/bash"]
