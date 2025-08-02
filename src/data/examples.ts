import type { RExample } from '@/types'

export const examples: RExample[] = [
  {
    id: 'car-weight-mpg',
    title: 'Car weight vs fuel efficiency',
    description: 'Heavier cars consume more fuel - classic automotive relationship',
    code: `library(ggplot2)

# Load built-in R dataset about car characteristics
# Contains data on 32 car models from 1973-74
data(mtcars)
ggplot(mtcars, aes(x = wt, y = mpg)) +
  geom_point() +
  labs(title = "Car Weight vs Fuel Efficiency",
       x = "Weight (1000 lbs)",
       y = "Miles per Gallon") +
  theme_minimal()`,
  },
  {
    id: 'cylinders-matter',
    title: 'Why cylinder count matters',
    description: 'Engine cylinders affect both weight and fuel efficiency',
    code: `library(ggplot2)

# Load built-in dataset
# Visualize multiple variables: weight, mpg, and cylinder count
data(mtcars)
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
    id: 'efficient-cars-only',
    title: 'Focus on efficient cars',
    description: 'What makes fuel-efficient cars special?',
    code: `library(dplyr)
library(ggplot2)

# Load built-in dataset
# Filter cars with good fuel efficiency and summarize by cylinders
data(mtcars)
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
  labs(title = "Average MPG by Cylinder Count (Efficient Cars Only)",
       x = "Number of Cylinders",
       y = "Average MPG") +
  theme_minimal()`,
  },
  {
    id: 'manual-vs-automatic',
    title: 'Manual vs automatic transmission',
    description: 'Do manual transmissions really save fuel?',
    code: `library(dplyr)
library(ggplot2)

# Load built-in dataset
# Create grouped bar chart showing gears vs transmission type
data(mtcars)
gear_summary <- mtcars %>%
  group_by(gear, am) %>%
  summarize(count = n(), .groups = 'drop') %>%
  mutate(transmission = ifelse(am == 0, "Automatic", "Manual"))

ggplot(gear_summary, aes(x = factor(gear), y = count, fill = transmission)) +
  geom_col(position = "dodge") +
  scale_fill_manual(values = c("Automatic" = "#FF7F00", "Manual" = "#1F78B4")) +
  labs(title = "Cars by Gear Count and Transmission Type",
       x = "Number of Gears",
       y = "Count",
       fill = "Transmission") +
  theme_minimal() +
  theme(legend.position = "bottom")`,
  },
  {
    id: 'metal-bands-happiness',
    title: 'Metal bands vs happiness',
    description: 'Surprising correlation: more metal bands = happier countries',
    csvUrl: '/metal_bands_happiness.csv',
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
    id: 'global-warming',
    title: 'Global warming evidence',
    description: 'Temperature rise over the past decades',
    csvUrl: '/global_temperature.csv',
    code: `library(ggplot2)

# Load global temperature time series data
data <- read.csv("/tmp/global_temperature.csv", stringsAsFactors = FALSE)

# Create time series visualization with trend line
ggplot(data, aes(x = year)) +
  geom_line(aes(y = temperature_celsius), color = "#e74c3c", size = 1.5) +
  geom_point(aes(y = temperature_celsius), color = "#c0392b", size = 2) +
  geom_smooth(aes(y = temperature_celsius), method = "loess", se = TRUE, 
              color = "#e74c3c", alpha = 0.2) +
  labs(title = "Global Temperature Trend (2000-2020)",
       x = "Year",
       y = "Temperature (°C)",
       caption = "Data: Global temperature measurements") +
  theme_minimal()`,
  },
  {
    id: 'startup-gold-rush',
    title: 'The startup gold rush',
    description: 'Which sectors attract the most venture capital?',
    csvUrl: '/startup_funding.csv',
    code: `library(dplyr)
library(ggplot2)

# Load startup funding data
data <- read.csv("/tmp/startup_funding.csv", stringsAsFactors = FALSE)

# Explore the data structure
head(data)

# Summarize funding by sector
sector_summary <- data %>%
  group_by(sector) %>%
  summarise(
    total_funding = sum(funding_amount_usd),
    avg_funding = mean(funding_amount_usd),
    count = n(),
    .groups = 'drop'
  ) %>%
  arrange(desc(total_funding))

print(sector_summary)

# Create horizontal bar chart
ggplot(sector_summary, aes(x = reorder(sector, total_funding), 
                          y = total_funding / 1e6, fill = sector)) +
  geom_col(show.legend = FALSE) +
  coord_flip() +
  labs(title = "Total Startup Funding by Sector",
       x = "Sector",
       y = "Funding Amount (Million USD)") +
  theme_minimal()`,
  },
  {
    id: 'custom-csv-template',
    title: 'Your CSV template',
    description: 'Starting point for analyzing your own data',
    code: `library(dplyr)
library(ggplot2)

# TO USE YOUR OWN DATA:
# 1. Upload your CSV file using the interface above
# 2. Replace the filename below with your actual filename
# data <- read.csv("/tmp/your_filename.csv", stringsAsFactors = FALSE)

# For demonstration, load iris - built-in dataset with flower measurements
# iris contains 150 observations of 3 species with 4 measurements each
data(iris)
data <- iris

# Explore your data structure
str(data)      # Show data types and structure
head(data)     # Show first 6 rows
summary(data)  # Show statistical summary

# Example scatter plot - modify based on your columns
ggplot(data, aes(x = Sepal.Length, y = Sepal.Width, color = Species)) +
  geom_point(size = 3, alpha = 0.7) +
  labs(title = "Your Data Visualization",
       x = "X Variable",
       y = "Y Variable") +
  theme_minimal()`,
  },
]