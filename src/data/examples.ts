import type { RExample } from '@/types'

export const examples: RExample[] = [
  {
    id: 'basic-plot',
    title: 'Basic ggplot2',
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

print(mtcars_summary)

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
    id: 'csv-example',
    title: 'Work with uploaded CSV',
    description: 'Template for working with uploaded CSV data',
    code: `# This example assumes you've uploaded a CSV file
# The data will be available as 'data' variable

# Uncomment and modify the following lines based on your CSV structure:

# library(dplyr)
# library(ggplot2)

# # View the first few rows
# head(data)

# # Basic summary
# summary(data)

# # Example plot (adjust column names as needed)
# ggplot(data, aes(x = column1, y = column2)) +
#   geom_point() +
#   labs(title = "Your Data Visualization",
#        x = "X-axis Label",
#        y = "Y-axis Label") +
#   theme_minimal()`,
  },
]