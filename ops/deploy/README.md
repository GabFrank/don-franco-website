# Deploy Don Franco - DigitalOcean Droplet (Fedora)

## Prerequisitos en el servidor

- Fedora (Droplet con imagen Fedora).
- Nginx instalado.
- Usuario de deploy: `franco` (contraseña: `franco`), con acceso SSH por llave para el workflow.
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

En los pasos siguientes, los archivos de configuración se pueden crear con **`tee`** (heredoc o pipe desde la terminal) o con **`vim`** (editar y pegar contenido); en cada paso se indican ambas opciones.

1. Crear usuario `franco` (si no existe) y directorio con permisos:
   ```bash
   sudo useradd -m -s /bin/bash franco
   echo 'franco:franco' | sudo chpasswd
   sudo mkdir -p /var/www/donfranco/releases
   sudo chown -R franco:franco /var/www/donfranco
   ```
   Añadir la llave pública SSH de deploy a `~franco/.ssh/authorized_keys` para que GitHub Actions pueda conectar.

2. Nginx (Fedora usa `conf.d`): crear `/etc/nginx/conf.d/donfranco.conf` con el contenido de `ops/nginx/donfranco.conf` del repo. Ajustar `server_name` y `root` según tu dominio y ruta.

   **Con vim:** crear el archivo y pegar el contenido.
   ```bash
   sudo vim /etc/nginx/conf.d/donfranco.conf
   ```
   (Pegar el contenido de `ops/nginx/donfranco.conf`, guardar con `:wq`.)

   **Con tee y heredoc:** pegar el bloque completo (incluido el EOF final) en la terminal.
   ```bash
   sudo tee /etc/nginx/conf.d/donfranco.conf << 'EOF'
   server {
       listen 80;
       server_name donfrancorestaurante.com www.donfrancorestaurante.com;
       root /var/www/donfranco/current;
       index index.html;
       location / { try_files $uri $uri/ /index.html; }
       location ~* \.(js|css|png|jpg|jpeg|gif|svg|webp|woff2|ico)$ {
           expires 30d; add_header Cache-Control "public, immutable";
       }
       add_header X-Frame-Options "SAMEORIGIN" always;
       add_header X-Content-Type-Options "nosniff" always;
       add_header Referrer-Policy "strict-origin-when-cross-origin" always;
   }
   EOF
   ```
   Dominio: `donfrancorestaurante.com` (ya configurado).

   Luego probar y recargar:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```

3. SSL (recomendado): instalar Certbot y obtener certificado:
   ```bash
   sudo dnf install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d donfrancorestaurante.com -d www.donfrancorestaurante.com
   ```
   Luego actualizar la config de Nginx con el bloque HTTPS (ver comentarios en `donfranco.conf`) y recargar.

4. Instalación de Nginx (si no está): `sudo dnf install -y nginx` y habilitar: `sudo systemctl enable --now nginx`. Abrir firewall: `sudo firewall-cmd --permanent --add-service={http,https}` y `sudo firewall-cmd --reload`. Con SELinux activo, el contenido en `/var/www/` suele tener el contexto correcto; si Nginx no sirve los archivos, revisar con `ls -Z` y `restorecon -Rv /var/www/donfranco` si hace falta.

5. Sudo para reload nginx sin contraseña (para el usuario `franco`).

   **Con tee:**
   ```bash
   echo 'franco ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx' | sudo tee /etc/sudoers.d/franco-reload
   sudo chmod 440 /etc/sudoers.d/franco-reload
   ```

   **Con vim:** crear el archivo y escribir la línea.
   ```bash
   sudo vim /etc/sudoers.d/franco-reload
   ```
   Contenido: `franco ALL=(ALL) NOPASSWD: /bin/systemctl reload nginx`. Guardar y salir (`:wq`). Luego `sudo chmod 440 /etc/sudoers.d/franco-reload`.

## Secrets en GitHub

Configurar en el repo: Settings → Secrets and variables → Actions:

- `DO_HOST`: IP o hostname del Droplet.
- `DO_USER`: usuario SSH → `franco`.
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
