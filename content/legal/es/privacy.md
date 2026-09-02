# Política de privacidad

**Última actualización:** September 1, 2026

Esta política explica cómo se trata la información cuando usas **Kit**, un conjunto de utilidades publicadas como sitio web estático y pensadas para funcionar en el navegador.

## Principio básico

Kit está diseñado para que **el trabajo con tus archivos ocurra en tu dispositivo**. No operamos un servidor de aplicación que reciba, almacene o analice el contenido de los documentos, imágenes o medios que abres en las herramientas.

## Qué no hace Kit

Al utilizar las herramientas (por ejemplo, unir PDF o comprimir imágenes):

- Tus archivos **no se envían** a un backend de Kit para procesarlos.
- **No** creamos cuentas de usuario.
- **No** vendemos datos personales.
- **No** integramos SDKs publicitarios ni seguimientos entre sitios con fines de publicidad.

## Información que puede existir alrededor del servicio

### 1. Datos que permanecen en tu dispositivo

El navegador puede guardar en almacenamiento local información limitada, como:

- Preferencias de apariencia (tema claro, oscuro o del sistema)
- Idioma elegido
- Favoritos o herramientas fijadas
- **Resúmenes del historial** (herramienta usada, momento aproximado, breve descripción)—**no** el contenido de tus archivos
- Preajustes que decidas guardar

Puedes vaciar el historial desde Ajustes o borrar los datos del sitio en el navegador.

### 2. Registros de red y alojamiento

Kit suele servirse como archivos estáticos en **Cloudflare Pages** (sitio canónico: trykit.pages.dev), con una copia de seguridad en GitHub Pages. Cuando tu navegador pide páginas o recursos, el anfitrión puede registrar datos técnicos habituales: dirección IP, agente de usuario, hora y URL solicitada. Ese registro depende de la infraestructura del anfitrión, no de un servidor de Kit que abra tus documentos.

### 3. Recursos de terceros opcionales

Las herramientas PDF cargan el worker de pdf.js, las fuentes y los recursos relacionados **desde este mismo sitio** (van incluidos en la app). Las herramientas de audio y vídeo cargan un motor FFmpeg WebAssembly **desde este mismo sitio**. El contenido de tus archivos permanece en el navegador; esas bibliotecas son código de la aplicación, no un destino al que enviemos tus documentos.

### 4. Tipos de cambio

Cuando actualizas los tipos de cambio, este navegador consulta la API pública de Frankfurter. La solicitud puede compartir con Frankfurter metadatos de red estándar (como dirección IP, agente de usuario, hora y URL solicitada). Los tipos pueden proceder de la caché de este navegador y estar desactualizados. Son únicamente datos de referencia diarios, no una garantía para operaciones, contabilidad, impuestos o liquidaciones.

## Aplicación web progresiva (PWA)

Si instalas Kit o permites el uso sin conexión, un *service worker* puede guardar en caché **la carcasa de la aplicación** (páginas, scripts, estilos, iconos). Kit no está pensado para almacenar tus archivos personales en esa caché.

## Menores de edad

Kit es una herramienta de uso general. No está dirigida a menores de 13 años y, al no ofrecer cuentas, no recopilamos de forma deliberada datos personales de menores mediante un sistema de registro.

## Cambios

Podemos actualizar esta política cuando cambie el producto o la normativa. Modificaremos la fecha de «Última actualización» al hacerlo. Si sigues usando Kit después del cambio, das por leída la versión revisada.

## Contacto

Para preguntas sobre privacidad: [contact.timg@icloud.com](mailto:contact.timg@icloud.com).

Publicado por **Tim G (GitHub: TGthms)**.
