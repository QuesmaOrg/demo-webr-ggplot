import type { RExample } from '@/types'

export const examples: RExample[] = [
  {
    id: 'iris-petal-scatter',
    title: 'Iris sepal dimensions',
    description: 'Explore the relationship between sepal length and width across iris species',
    code: `library(ggplot2)

# Load the classic iris dataset
# Contains measurements for 150 iris flowers from 3 species
data(iris)

# Create scatter plot of sepal dimensions
ggplot(iris, aes(x = Sepal.Length, y = Sepal.Width, color = Species)) +
  geom_point(size = 3, alpha = 0.8) +
  labs(title = "Iris Sepal Dimensions by Species",
       x = "Sepal Length (cm)",
       y = "Sepal Width (cm)") +
  theme_minimal() +
  theme(legend.position = "bottom")`,
  },
  {
    id: 'kawaii-iris',
    title: 'Kawaii-style iris visualization',
    description: 'A playful, pastel visualization of iris sepal dimensions',
    code: `library(ggplot2)

# Load iris dataset for a cute visualization
data(iris)

# Create a simple kawaii-style plot  
ggplot(iris, aes(x = Sepal.Length, y = Sepal.Width, color = Species)) +
  # Use flower-shaped points
  geom_point(size = 8, shape = 8, stroke = 2, alpha = 0.9) +
  # Simple pastel kawaii colors
  scale_color_manual(values = c("setosa" = "#FF69B4",      # Hot pink
                                "versicolor" = "#DDA0DD",   # Plum  
                                "virginica" = "#87CEEB")) + # Sky blue
  # Add cute title and labels
  labs(title = "✿ Kawaii Iris Garden ✿",
       x = "Sepal Length ♡",
       y = "Sepal Width ♡") +
  # Simple kawaii theme
  theme_minimal() +
  theme(
    plot.background = element_rect(fill = "#FFF0F5", color = NA),
    panel.background = element_rect(fill = "#FFFAFA", color = NA),
    panel.grid = element_line(color = "#FFE0F0", size = 0.3),
    text = element_text(color = "#FF1493"),
    plot.title = element_text(size = 18, face = "bold", hjust = 0.5),
    legend.position = "bottom",
    legend.background = element_blank(),
    legend.key = element_blank(),
    axis.text = element_text(color = "#FF69B4"),
    axis.title = element_text(face = "bold")
  )`,
  },
  {
    id: 'iris-violin-panels',
    title: 'Iris measurements distribution',
    description: 'Violin plots showing distribution of all iris measurements in a 2x2 panel',
    code: `library(ggplot2)
library(tidyr)

# Load iris dataset
data(iris)

# Reshape data to long format for faceting
iris_long <- iris %>%
  pivot_longer(cols = -Species, 
               names_to = "Measurement", 
               values_to = "Value")

# Create 2x2 panel of violin plots
ggplot(iris_long, aes(x = Species, y = Value, fill = Species)) +
  geom_violin(alpha = 0.7, scale = "width", trim = FALSE) +
  facet_wrap(~ Measurement, scales = "free_y", ncol = 2) +
  scale_fill_manual(values = c("setosa" = "#FF7F50", 
                               "versicolor" = "#9370DB", 
                               "virginica" = "#20B2AA")) +
  labs(title = "Distribution of Iris Measurements",
       subtitle = "Violin plots showing the distribution and density of each measurement",
       x = NULL,
       y = "Measurement (cm)") +
  theme_minimal() +
  theme(
    legend.position = "none",
    strip.text = element_text(face = "bold", size = 12),
    strip.background = element_rect(fill = "#F0F0F0", color = NA),
    panel.spacing = unit(1, "lines")
  )`,
  },
  {
    id: 'metal-bands-happiness',
    title: 'Metal bands vs happiness',
    description: 'Surprising correlation: more metal bands = happier countries',
    csvUrl: './metal_bands_happiness.csv',
    code: `library(ggplot2)
library(ggrepel)

# Load CSV data - correlation between metal bands and happiness by country
data <- read.csv("/tmp/metal_bands_happiness.csv", stringsAsFactors = FALSE)

# Create labeled scatter plot with logarithmic scale
ggplot(data, aes(x = Metal.bands.per.capita, y = Score, label = Country.or.region)) +
  scale_x_log10() +
  stat_smooth(method = "lm", linewidth = 0.5, alpha = 0.2) +
  geom_point(color = "red", size = 0.8) +
  geom_text_repel(size = 2.5, point.size = 0.5, segment.alpha = 0.5, segment.color = "red") +
  xlab("Metal bands per 1M people") +
  ylab("Average happiness score") +
  labs(title = "Metal Bands per Capita vs Happiness Score",
       caption = "Read more: https://p.migdal.pl/blog/2023/01/metal-bands-happiness-correlation") +
  theme_minimal()`,
  },
  {
    id: 'custom-csv-template',
    title: 'Your CSV template',
    description: 'Starting point for analyzing your own data',
    code: `library(ggplot2)

# Upload your CSV file using the button above
# Then change "your_filename.csv" to your actual filename and press Run
data <- read.csv("/tmp/your_filename.csv", stringsAsFactors = FALSE)`,
  },
]