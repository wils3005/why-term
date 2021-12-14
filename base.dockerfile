FROM alpine:3.15.0

RUN apk --no-cache add \
  curl=7.80.0-r0 \
  nodejs=16.13.1-r0 \
  npm=8.1.3-r0

HEALTHCHECK CMD curl --fail http://127.0.0.1

ENTRYPOINT [ "/bin/sh" ]
