# Guía de Personalización - Ocelon

Esta guía te ayudará a personalizar el sistema Ocelon con tu propio logo, videos promocionales y redes sociales.

## Opción 1: Usando el Panel de Administración (Recomendado)

### Paso 1: Acceder al Panel de Admin

1. Inicia sesión con el usuario administrador:
   ```
   Email: admin@ocelon.com
   Password: password123
   ```

2. Desde el dashboard, haz clic en "Panel de Administración" en el menú lateral

3. O accede directamente a: `http://localhost:3000/admin.html`

### Paso 2: Configurar el Logo

1. Ve a la sección **"Contenido"**
2. En **"Logo y Marca"**:
   - Sube tu archivo de logo (PNG, JPG o SVG recomendado)
   - Modifica el texto del logo si lo deseas
   - Cambia el subtítulo
   - Vista previa en tiempo real
   - Haz clic en "Guardar Cambios"

### Paso 3: Agregar Video Promocional

1. En la sección **"Video Promocional"**:
   
   **Opción A - Video de YouTube:**
   - Ve a tu video en YouTube
   - Haz clic en "Compartir" → "Insertar"
   - Copia la URL que empieza con `https://www.youtube.com/embed/`
   - Pégala en el campo "URL del Video"
   
   **Opción B - Video de Vimeo:**
   - Similar a YouTube, usa la URL de embed
   
   **Opción C - Video propio:**
   - Sube tu archivo de video (MP4, WebM, OGG)
   - Máximo 100MB
   
2. Vista previa en tiempo real
3. Haz clic en "Guardar Video"

### Paso 4: Configurar Redes Sociales

1. Ve a la sección **"Redes Sociales"**
2. Ingresa las URLs completas de tus redes sociales:
   - Facebook: `https://facebook.com/tu_pagina`
   - Twitter: `https://twitter.com/tu_usuario`
   - Instagram: `https://instagram.com/tu_usuario`
   - LinkedIn: `https://linkedin.com/company/tu_empresa`
   - YouTube: `https://youtube.com/@tu_canal`
   - TikTok: `https://tiktok.com/@tu_usuario`
3. Vista previa en tiempo real
4. Haz clic en "Guardar Redes Sociales"

### Paso 5: Configuración General

1. Ve a la sección **"Configuración General"**
2. Actualiza:
   - Dirección física de tu empresa
   - Teléfono de contacto
   - Email de contacto
   - Email de soporte técnico
3. Haz clic en "Guardar Configuración"

## Opción 2: Modificación Manual de Archivos

### Logo

**Archivo:** `public/index.html`

Busca esta línea (aproximadamente línea 19):
```html
<span class="logo-text-hero">OCELON</span>
```

Cámbiala por:
```html
<span class="logo-text-hero">TU MARCA</span>
```

Para el subtítulo, busca:
```html
<p class="logo-subtitle">Sistema Digital de Estacionamiento</p>
```

Cámbialo por:
```html
<p class="logo-subtitle">Tu Subtítulo Personalizado</p>
```

### Logo como Imagen

Si quieres usar un archivo de imagen en lugar de texto:

1. Coloca tu logo en `public/images/logo.png`
2. En `public/index.html`, busca:
```html
<div class="hero-logo mb-4">
    <div class="logo-main">
        <span class="logo-text-hero">OCELON</span>
    </div>
    <p class="logo-subtitle">Sistema Digital de Estacionamiento</p>
</div>
```

3. Reemplázalo por:
```html
<div class="hero-logo mb-4">
    <img src="images/logo.png" alt="Tu Logo" class="logo-image">
    <p class="logo-subtitle">Sistema Digital de Estacionamiento</p>
</div>
```

4. Agrega este estilo en `public/css/styles.css`:
```css
.logo-image {
    max-width: 400px;
    height: auto;
    filter: drop-shadow(0 0 20px rgba(16, 185, 129, 0.5));
}
```

### Video Promocional

**Archivo:** `public/index.html`

Busca la sección de video (aproximadamente línea 150):
```html
<div class="video-placeholder">
    <i class="fas fa-play-circle"></i>
    <p class="mt-3">Video Demostrativo de Ocelon</p>
    <small class="text-white-50">Aquí se integrará tu video promocional</small>
</div>
```

**Para YouTube:**
```html
<iframe width="100%" height="500" 
    src="https://www.youtube.com/embed/TU_VIDEO_ID" 
    frameborder="0" 
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
    allowfullscreen>
</iframe>
```

**Para video local:**
```html
<video width="100%" height="500" controls>
    <source src="videos/tu-video.mp4" type="video/mp4">
    Tu navegador no soporta el tag de video.
</video>
```

### Redes Sociales

**Archivo:** `public/index.html`

Busca la sección de redes sociales (aproximadamente línea 50):
```html
<div class="social-links">
    <a href="#" class="social-link" title="Facebook">
        <i class="fab fa-facebook-f"></i>
    </a>
    <!-- más enlaces -->
</div>
```

Reemplaza los `href="#"` con tus URLs reales:
```html
<div class="social-links">
    <a href="https://facebook.com/tu_pagina" target="_blank" class="social-link" title="Facebook">
        <i class="fab fa-facebook-f"></i>
    </a>
    <a href="https://twitter.com/tu_usuario" target="_blank" class="social-link" title="Twitter">
        <i class="fab fa-twitter"></i>
    </a>
    <!-- continúa con las demás redes -->
</div>
```

### Información de Contacto

**Archivo:** `public/index.html`

Busca la sección de contacto (aproximadamente línea 450):
```html
<div class="contact-item">
    <i class="fas fa-map-marker-alt"></i>
    <div>
        <h5>Ubicación</h5>
        <p>Aguascalientes, Aguascalientes, México</p>
    </div>
</div>
```

Actualiza con tu información real.

## Personalización Avanzada

### Cambiar Colores de la Marca

**Archivo:** `public/css/styles.css`

Al inicio del archivo verás:
```css
:root {
    --ocelon-green: #10b981;
    --ocelon-green-dark: #059669;
    --ocelon-dark: #0f172a;
    --ocelon-gray: #1e293b;
    --ocelon-light-gray: #334155;
    --ocelon-accent: #14b8a6;
}
```

Cambia estos valores hexadecimales por los colores de tu marca:
```css
:root {
    --ocelon-green: #TU_COLOR_PRINCIPAL;
    --ocelon-green-dark: #TU_COLOR_OSCURO;
    --ocelon-dark: #0f172a;
    --ocelon-gray: #1e293b;
    --ocelon-light-gray: #334155;
    --ocelon-accent: #TU_COLOR_ACENTO;
}
```

### Agregar Más Imágenes

1. Crea la carpeta: `public/images/`
2. Coloca tus imágenes ahí
3. Úsalas en el HTML:
```html
<img src="images/mi-imagen.jpg" alt="Descripción">
```

### Cambiar Textos del Catálogo

**Archivo:** `public/index.html`

Busca la sección "Catálogo de Servicios" (línea ~240):
```html
<div class="service-card">
    <div class="service-header">
        <h3>Plan Básico</h3>
        <div class="service-price">
            <span class="price">$774</span>
            <span class="period">/ año</span>
        </div>
    </div>
    <!-- características -->
</div>
```

Modifica los textos, precios y características según tus planes reales.

## Tips y Mejores Prácticas

### Imágenes
- **Logo:** 500x500px en PNG transparente
- **Favicon:** 32x32px o 64x64px
- **Imágenes de hero:** 1920x1080px
- **Thumbnails:** 400x300px
- **Formato recomendado:** PNG para transparencia, JPG para fotos

### Videos
- **Resolución mínima:** 1280x720 (HD)
- **Duración recomendada:** 30-90 segundos
- **Formato:** MP4 (H.264)
- **Peso máximo:** 100MB (optimiza si es necesario)

### Redes Sociales
- Usa URLs completas (https://...)
- Verifica que los enlaces funcionen
- Mantén consistencia en tu presencia digital

### SEO
Modifica el título y descripción en `public/index.html`:
```html
<head>
    <title>Tu Empresa - Sistema Digital</title>
    <meta name="description" content="Descripción de tu servicio">
</head>
```

## Soporte

Si necesitas ayuda adicional:
1. Revisa el README.md
2. Consulta la documentación de Bootstrap y Font Awesome
3. Revisa el código comentado en los archivos

## Checklist de Personalización

- [ ] Logo actualizado
- [ ] Subtítulo personalizado
- [ ] Video promocional agregado
- [ ] Redes sociales configuradas
- [ ] Información de contacto actualizada
- [ ] Colores de marca ajustados
- [ ] Textos del catálogo modificados
- [ ] Imágenes adicionales agregadas
- [ ] SEO configurado
- [ ] Pruebas en diferentes dispositivos

¡Listo! Tu sistema Ocelon está personalizado.