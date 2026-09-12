# Sistema Oficial de Consulta de Horarios — FCM UABC

Aplicación web interactiva para la consulta, filtrado, visualización y exportación/impresión de horarios académicos de la **Facultad de Ciencias Marinas (FCM)** de la **Universidad Autónoma de Baja California (UABC)**, ciclo escolar **2026-2**.

---

## 🚀 Guía de Exportación y Publicación en GitHub

### 1. Subir el proyecto a tu repositorio de GitHub

Si aún no has vinculado tu repositorio remoto, abre tu terminal en esta carpeta y ejecuta:

```bash
# 1. Inicializar git (si no está inicializado)
git init
git branch -M main

# 2. Agregar todos los archivos y crear el commit inicial
git add .
git commit -m "feat: Sistema de Consulta de Horarios FCM UABC con soporte de impresión y exportación"

# 3. Vincular con tu repositorio en GitHub (reemplaza con tu URL)
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git

# 4. Enviar los cambios
git push -u origin main
```

---

### 2. ¿Por qué la página se ve en blanco en GitHub y cómo solucionarlo?

Una página en blanco en GitHub Pages ocurre por una de dos razones muy comunes:

#### Causa Principal: GitHub Pages está configurado para servir la raíz `/` en vez de los archivos compilados
Por defecto, GitHub Pages intenta servir la carpeta raíz (`/`), la cual contiene el código fuente sin compilar (`index.html` apuntando a `src/main.tsx`). Como los navegadores no pueden ejecutar TypeScript directamente, la pantalla queda en blanco.

Tienes **dos soluciones infalibles** (elige la que prefieras):

#### Opción 1: Publicación instantánea mediante la carpeta `/docs` (¡La más rápida!)
El proyecto ya genera automáticamente los archivos de producción compilados dentro de la carpeta `/docs`:
1. En tu repositorio de GitHub, entra a **Settings** (Configuración) > menú lateral **Pages**.
2. En **Build and deployment**:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (o tu rama principal)
   - **Folder**: Selecciona `/docs` *(¡NO selecciones `/ (root)`!)*
3. Haz clic en **Save**.
4. En 1 o 2 minutos, tu sitio estará en línea funcionando sin pantalla blanca.

#### Opción 2: Publicación automática mediante GitHub Actions
Si prefieres que GitHub compile automáticamente cada cambio:
1. En tu repositorio de GitHub, entra a **Settings** > **Pages**.
2. En **Build and deployment** > **Source**, cambia el selector de `Deploy from a branch` a **GitHub Actions**.
3. Ve a la pestaña **Actions** de tu repositorio y verifica que el flujo *Desplegar a GitHub Pages* esté completado en verde.
4. En **Settings** > **Actions** > **General** > **Workflow permissions**, asegúrate de que esté marcado **Read and write permissions**.

> **Nota sobre la URL**: Asegúrate de abrir la URL con la barra inclinada al final, por ejemplo: `https://TU-USUARIO.github.io/TU-REPOSITORIO/`. El proyecto ya incluye una redirección automática para asegurar que todos los estilos y scripts relativos carguen sin errores 404.

---

## 🌐 Cómo Insertar / Desplegar en Google Sites

La aplicación está diseñada y optimizada para funcionar fluidamente incrustada dentro de cualquier página de **Google Sites**:

### Opción A: Incorporar directamente por URL (Recomendado)
1. Abre tu sitio en edición en **Google Sites**.
2. En el panel derecho de herramientas, haz clic en **Insertar** > **Incorporar** (`Embed`).
3. Selecciona la pestaña **Por URL**.
4. Pega la URL pública generada por GitHub Pages:
   ```
   https://TU-USUARIO.github.io/TU-REPOSITORIO/
   ```
5. Haz clic en **Insertar**.
6. Ajusta el tamaño del recuadro arrastrando los puntos azules para que ocupe todo el ancho y una altura cómoda (por ejemplo, 850px o más).

### Opción B: Incorporar mediante código HTML (`iframe`)
Si deseas fijar atributos específicos, en Google Sites selecciona **Insertar** > **Incorporar** > pestaña **Código para incorporar**:

```html
<iframe 
  src="https://TU-USUARIO.github.io/TU-REPOSITORIO/" 
  width="100%" 
  height="900px" 
  style="border: none; border-radius: 12px; overflow: hidden;"
  allow="clipboard-write"
  title="Horarios FCM UABC">
</iframe>
```

---

## 🛠️ Tecnologías Utilizadas

- **React 19** + **TypeScript**
- **Vite 6** + **Tailwind CSS v4**
- **jsPDF** & **html2canvas** (Exportación de PDF e imágenes sin bloqueos)
- **PapaParse** (Procesamiento reactivo de fuentes CSV en vivo de Google Sheets)
- **Lucide React** (Iconografía)
- **Motion** (Animaciones fluidas de interfaz)

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo (puerto 3000)
npm run dev

# Compilar para producción
npm run build

# Validar TypeScript
npm run lint
```
