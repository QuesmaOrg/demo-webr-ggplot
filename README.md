# WebR ggplot2 & dplyr Demo

A minimal Vue.js application demonstrating interactive R data visualization and manipulation using WebR, ggplot2, and dplyr in the browser.

## Features

- 🎨 **Interactive Code Editor**: Monaco editor with R syntax highlighting
- 📊 **Built-in Examples**: Pre-configured examples for ggplot2 and dplyr
- 📁 **CSV Upload**: Drag-and-drop CSV file upload functionality
- 🖥️ **Real-time Output**: Live R code execution with stdout/stderr display
- 📈 **Plot Visualization**: SVG plot rendering in the browser
- 🎯 **Clean Architecture**: Well-organized Vue 3 components with TypeScript

## Tech Stack

- **Vue 3** with TypeScript
- **Vite** for build tooling
- **WebR** for R in the browser
- **Monaco Editor** for code editing
- **ESLint** with strict rules
- **Prettier** for code formatting
- **pnpm** for package management

## Quick Start

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Run development server**:
   ```bash
   pnpm dev
   ```

3. **Build for production**:
   ```bash
   pnpm build
   ```

## Usage

1. **Select Examples**: Choose from pre-built examples in the dropdown
2. **Upload CSV**: Drag and drop CSV files or click to browse
3. **Edit Code**: Use the Monaco editor to write R code
4. **Run Code**: Click "Run Code" to execute R scripts
5. **View Results**: See output, plots, and any errors in the output panel

## Example Scripts

- **Basic ggplot2**: Simple scatter plot with mtcars dataset
- **dplyr filtering**: Data manipulation and summarization
- **Enhanced scatter plot**: Color mapping and trend lines
- **Bar chart**: Grouped bar charts with custom styling
- **CSV template**: Template for working with uploaded data

## Project Structure

```
src/
├── components/          # Vue components
│   ├── CodeEditor.vue   # Monaco editor wrapper
│   ├── FileUpload.vue   # CSV upload component
│   ├── ExampleSelector.vue # Example dropdown
│   └── OutputDisplay.vue   # Results display
├── composables/         # Vue composables
│   └── useWebR.ts       # WebR integration logic
├── data/               # Static data
│   └── examples.ts     # R code examples
├── types/              # TypeScript types
│   └── index.ts        # Type definitions
├── App.vue             # Main application
├── main.ts             # Application entry point
└── style.css           # Global styles
```

## Development

- **Linting**: `pnpm lint`
- **Formatting**: `pnpm format`
- **Type checking**: `pnpm build` (includes vue-tsc)

## WebR Configuration

The application uses WebR with the following packages pre-installed:
- `ggplot2` for data visualization
- `dplyr` for data manipulation

WebR is configured with CORS headers and proper service worker setup for browser compatibility.

## Contributing

1. Follow the existing code style (ESLint + Prettier)
2. Use TypeScript for type safety
3. Keep components small and focused
4. Add examples for new R functionality

## License

MIT License - feel free to use this project as a starting point for your own WebR applications.