# Deploy Don Franco - DigitalOcean Droplet

## Prerequisitos en el servidor

- Ubuntu LTS.
- Nginx instalado.
- Usuario de deploy (ej. `deploy`) con acceso SSH por llave.
- Directorio de la app: `/var/www/donfranco` (o el valor de `DEPLOY_PATH`).

## Estructura en el servidor

```text
/var/www/donfranco/
  current -> releases/20260215120000   (symlink a la release activa)
  releases/
    20260215120000/
      index.html
      _astro/
      ...
    20260215110000/
      ...
```

## Configuración inicial (una vez)

1. Crear directorio y permisos:
   ```bash
   sudo mkdir -p /var/www/donfranco/releases
   sudo chown -R deploy:deploy /var/www/donfranco
   ```

2. Nginx: copiar `ops/nginx/donfranco.conf` a `/etc/nginx/sites-available/donfranco`, ajustar `server_name` y `root`, habilitar sitio y recargar:
   ```bash
   sudo ln -s /etc/nginx/sites-available/donfranco /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. SSL (recomendado): `sudo certbot --nginx -d donfranco.com -d www.donfranco.com` y luego actualizar la config de Nginx con el bloque HTTPS (ver comentarios en `donfranco.conf`).

4. Sudo para reload nginx sin contraseña (opcional, para el usuario de deploy):
   ```bash
   echo 'deploy ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/deploy-reload
   sudo chmod 440 /etc/sudoers.d/deploy-reload
   ```

## Secrets en GitHub

Configurar en el repo: Settings → Secrets and variables → Actions:

- `DO_HOST`: IP o hostname del Droplet.
- `DO_USER`: usuario SSH (ej. `deploy`).
- `DO_PORT`: puerto SSH (opcional; si no se define, el workflow usa 22).
- `SSH_PRIVATE_KEY`: contenido de la clave privada (ej. `id_ed25519`).
- `KNOWN_HOSTS`: salida de `ssh-keyscan -p PORT HOST` para evitar preguntas de host key.
- `DEPLOY_PATH`: ruta absoluta (ej. `/var/www/donfranco`).

## Rollback

Si un deploy deja el sitio roto:

1. Conectar por SSH al servidor.
2. Listar releases: `ls -la /var/www/donfranco/releases/`.
3. Apuntar `current` a la release anterior:
   ```bash
   cd /var/www/donfranco
   ln -sfn /var/www/donfranco/releases/TIMESTAMP_ANTERIOR current
   sudo systemctl reload nginx
   ```

## Limpieza de releases antiguas

Para no llenar disco, se pueden borrar releases viejas (dejar al menos la actual y la anterior):

```bash
ls -t /var/www/donfranco/releases/ | tail -n +3 | xargs -I {} rm -rf /var/www/donfranco/releases/{}
```

Conviene automatizar esto con un cron o un paso opcional en el workflow.
