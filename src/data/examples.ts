import type { RExample } from '@/types'

export const examples: RExample[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Simple scatter plot to get you started with ggplot2',
    code: `# WebR ggplot2 & dplyr Demo
# Select an example or write your own code

library(ggplot2)
library(dplyr)

# Create your first visualization
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  theme_minimal()`,
  },
  {
    id: 'basic-plot',
    title: 'Basic example',
    description: 'Simple scatter plot with built-in mtcars dataset',
    code: `library(ggplot2)

# Basic scatter plot
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Car Weight vs MPG",
       x = "Weight (1000 lbs)",
       y = "Miles per Gallon") +
  theme_minimal()`,
  },
  {
    id: 'dplyr-filter',
    title: 'Data filtering with dplyr',
    description: 'Filter and summarize data using dplyr',
    code: `library(dplyr)
library(ggplot2)

# Filter and summarize data
mtcars_summary <- mtcars %>%
  filter(mpg > 20) %>%
  group_by(cyl) %>%
  summarize(
    avg_mpg = mean(mpg),
    count = n(),
    .groups = 'drop'
  )

# Visualize the summary
ggplot(mtcars_summary, aes(x = factor(cyl), y = avg_mpg)) +
  geom_col(fill = "steelblue") +
  geom_text(aes(label = paste("n =", count)), vjust = -0.5) +
  labs(title = "Average MPG by Cylinder Count (MPG > 20)",
       x = "Number of Cylinders",
       y = "Average MPG") +
  theme_minimal()`,
  },
  {
    id: 'scatter-plot',
    title: 'Enhanced scatter plot',
    description: 'Scatter plot with color mapping and smooth line',
    code: `library(ggplot2)

# Enhanced scatter plot with color and smooth line
ggplot(mtcars, aes(x = wt, y = mpg, color = factor(cyl))) +
  geom_point(size = 3, alpha = 0.7) +
  geom_smooth(method = "lm", se = FALSE) +
  scale_color_manual(values = c("4" = "#E31A1C", "6" = "#1F78B4", "8" = "#33A02C")) +
  labs(title = "Car Weight vs MPG by Cylinder Count",
       x = "Weight (1000 lbs)",
       y = "Miles per Gallon",
       color = "Cylinders") +
  theme_minimal() +
  theme(legend.position = "bottom")`,
  },
  {
    id: 'bar-chart',
    title: 'Bar chart with dplyr',
    description: 'Create a bar chart after data manipulation',
    code: `library(dplyr)
library(ggplot2)

# Create bar chart with data manipulation
gear_summary <- mtcars %>%
  group_by(gear, am) %>%
  summarize(count = n(), .groups = 'drop') %>%
  mutate(transmission = ifelse(am == 0, "Automatic", "Manual"))

ggplot(gear_summary, aes(x = factor(gear), y = count, fill = transmission)) +
  geom_col(position = "dodge") +
  scale_fill_manual(values = c("Automatic" = "#FF7F00", "Manual" = "#1F78B4")) +
  labs(title = "Number of Cars by Gear and Transmission Type",
       x = "Number of Gears",
       y = "Count",
       fill = "Transmission") +
  theme_minimal() +
  theme(legend.position = "bottom")`,
  },
  {
    id: 'startup-analysis',
    title: 'Startup funding analysis',
    description: 'Analyze startup funding data by sector and region',
    csvUrl: '/startup_funding.csv',
    code: `library(dplyr)
library(ggplot2)
library(scales)

# Load the startup funding data
data <- read.csv("/tmp/startup_funding.csv", stringsAsFactors = FALSE)

# Check the data
head(data)

# Analyze funding by sector
data %>%
  group_by(sector) %>%
  summarise(
    total_funding = sum(funding_amount_usd),
    avg_funding = mean(funding_amount_usd),
    count = n()
  ) %>%
  arrange(desc(total_funding))

# Create visualization
ggplot(data, aes(x = reorder(sector, funding_amount_usd), 
                 y = funding_amount_usd, fill = sector)) +
  geom_col(show.legend = FALSE) +
  coord_flip() +
  scale_y_continuous(labels = label_dollar(scale = 1e-6, suffix = "M")) +
  labs(title = "Startup Funding by Sector",
       x = "Sector",
       y = "Funding Amount (USD)",
       caption = "Data: Sample startup funding by sector and valuation") +
  theme_minimal()`,
  },
  {
    id: 'csv-example',
    title: 'Work with uploaded CSV',
    description: 'Generic example for any uploaded CSV file',
    code: `library(dplyr)
library(ggplot2)

# After uploading your CSV file, load it like this:
# data <- read.csv("/tmp/your_filename.csv", stringsAsFactors = FALSE)

# For now, using built-in iris dataset as example
data <- iris

# Explore your data structure
str(data)
head(data)
# summary(data)  # Uncomment for basic statistics

# Create a scatter plot
ggplot(data, aes(x = Sepal.Length, y = Sepal.Width, color = Species)) +
  geom_point(size = 3, alpha = 0.7) +
  labs(title = "Sepal Dimensions by Species",
       x = "Sepal Length (cm)",
       y = "Sepal Width (cm)",
       color = "Species") +
  theme_minimal() +
  theme(legend.position = "bottom")`,
  },
  {
    id: 'metal-bands-happiness',
    title: 'Metal bands vs happiness',
    description: 'Correlation between metal bands per capita and happiness score by country',
    csvUrl: '/metal_bands_happiness.csv',
    code: `library(ggplot2)
library(ggrepel)

# Load the data from the uploaded CSV file
data <- read.csv("/tmp/metal_bands_happiness.csv", stringsAsFactors = FALSE)

# Create the visualization
ggplot(data, aes(x = Metal.bands.per.capita, y = Score, label = Country.or.region)) +
  scale_x_log10() +
  stat_smooth(method = "lm", linewidth = 0.5, alpha = 0.2) +
  geom_point(color = "red", size = 0.8) +
  geom_text_repel(size = 2.5, point.size = 0.5, segment.alpha = 0.5, segment.color = "red") +
  xlab("Metal bands per 1M people") +
  ylab("Average happiness score") +
  labs(title = "Metal Bands per Capita vs Happiness Score",
       caption = "Data sources: Enc. Metallum (2016), after Jakub Marian; World Happiness Report (2022). Chart by Piotr Migdał, p.migdal.pl, CC-BY.") +
  theme_minimal()`,
  },
  {
    id: 'global-temperature',
    title: 'Global temperature trends',
    description: 'Analyze global temperature and CO2 trends over time',
    csvUrl: '/global_temperature.csv',
    code: `library(ggplot2)
library(dplyr)

# Load the global temperature data
data <- read.csv("/tmp/global_temperature.csv", stringsAsFactors = FALSE)

# Create temperature trend visualization
ggplot(data, aes(x = year)) +
  geom_line(aes(y = temperature_celsius), color = "#e74c3c", size = 1.5) +
  geom_point(aes(y = temperature_celsius), color = "#c0392b", size = 2) +
  geom_smooth(aes(y = temperature_celsius), method = "loess", se = TRUE, color = "#e74c3c", alpha = 0.2) +
  labs(title = "Global Temperature Trend (2000-2020)",
       x = "Year",
       y = "Temperature (°C)",
       caption = "Data: Global temperature measurements") +
  theme_minimal() +
  theme(plot.title = element_text(hjust = 0.5, size = 16, face = "bold"))`,
  },
]