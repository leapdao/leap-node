---
title: HTTPS support
---

Node doesn't support https, but you can configure a web server to run as a reverse proxy in front of the node.

Example configuration for nginx:

```
server {
  listen 443 ssl;
  server_name example.com;

  ssl on;
  ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
  ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
  include /etc/letsencrypt/options-ssl-nginx.conf;
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Fix the “It appears that your reverse proxy set up is broken" error.
    proxy_pass http://localhost:9545;
    proxy_read_timeout 90;

    proxy_redirect http://localhost:9545 https://example.com;
  }
}


server {
  listen 80;
  server_name example.com;

  location / {
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;

    # Fix the “It appears that your reverse proxy set up is broken" error.
    proxy_pass http://localhost:9545;
    proxy_read_timeout 90;

    proxy_redirect http://localhost:9545 https://example.com;
  }
}
```
