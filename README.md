# Property Management Dashboard Improvements

This repository contains the enhanced property management application with improved dashboard pages for various property monitoring systems.

## Key Improvements

### 1. Enhanced Dashboard Pages

#### WTP Dashboard (Water Treatment Plant)
- Added "Add New WTP Entry" button
- Implemented a complete form modal for adding new WTP entries
- Added property selection dropdown
- Enhanced charts with better visualizations:
  - Hardness comparison bar chart
  - Water quality line chart
  - Statistics overview cards
  - Detailed WTP phase cards with proper metrics

#### STP Dashboard (Sewage Treatment Plant)
- Fixed the API integration for creating new STP entries
- Added proper validation for form inputs
- Enhanced error handling with detailed error messages
- Improved chart visualizations:
  - Water quality charts
  - Flow comparison charts
  - Tank levels pie chart
  - Efficiency radar chart
  - Treatment efficiency visualizations

#### Diesel Generator Dashboard
- Added comprehensive dashboard with enhanced visualizations
- Added summary statistics cards
- Implemented advanced charts:
  - Running hours and efficiency chart
  - Diesel usage area chart
  - Generator performance radar chart
  - Diesel distribution pie chart
- Improved property selection functionality

### 2. Common Improvements Across All Dashboards
- Consistent property selection dropdown
- Proper error handling and loading states
- Responsive design for all screen sizes
- Consistent visual styling and color schemes
- More informative charts and data visualizations

### 3. API Integration Fixes
- Fixed payload formatting for STP and WTP API endpoints
- Enhanced error handling for API responses
- Improved data validation before submission
- Added proper data type conversion for numeric values

## Tech Stack
- React.js for frontend components
- TypeScript for type safety
- Recharts for data visualization
- Tailwind CSS for styling
- Lucide React for icons

## Getting Started

### Prerequisites
- Node.js 14.x or higher
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Start the development server:
```bash
npm run dev
# or
yarn dev
```

4. Access the application at http://localhost:3000

## Usage
1. Log in to the application
2. Navigate to the Daily Logs section
3. Select a dashboard (WTP, STP, or Diesel Generator)
4. Use the property selector to choose a property
5. View the data visualizations or add new entries

## API Endpoints
The application integrates with the following API endpoints:
- `GET /properties`: Fetch all properties
- `GET /properties/{id}/wtp`: Fetch WTP data for a property
- `GET /properties/{id}/stp`: Fetch STP data for a property
- `GET /diesel-generators/?property_id={id}`: Fetch diesel generators for a property
- `POST /wtp/`: Create a new WTP entry
- `POST /stp/`: Create a new STP entry
- `POST /diesel-generators/`: Create a new diesel generator 