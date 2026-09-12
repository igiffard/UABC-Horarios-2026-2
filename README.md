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

### 2. Publicación Automática con GitHub Actions (GitHub Pages)

El proyecto ya incluye el flujo de trabajo automatizado en `.github/workflows/deploy.yml`. Solo necesitas habilitar GitHub Pages en tu repositorio:

1. Ve a tu repositorio en GitHub: `https://github.com/TU-USUARIO/TU-REPOSITORIO`.
2. Haz clic en la pestaña **Settings** (Configuración) > sección lateral **Pages**.
3. En **Build and deployment** > **Source**, selecciona:
   - **GitHub Actions** (¡no selecciones "Deploy from a branch"!).
4. En cuanto hagas un `push` a la rama `main`, la acción compilará el proyecto automáticamente y lo publicará en:
   ```
   https://TU-USUARIO.github.io/TU-REPOSITORIO/
   ```

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
