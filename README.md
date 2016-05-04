# coopMap

##Description
An interactive article made for the RIT Media Sciences app. The article features a map made with the Google Maps API with points at locations of the companies at which our students have worked co-op position.

Users can interact with the map by tapping a point--this will zoom the map to that location and display information at the top of the screen including the city and state (or country) of the location and the list of co-op companies and the companys' respective industry.

Users can also filter the points by clicking the filter button at the bottom of the screen. They can then filter by 'State' or 'Industry', or reset the filter to show all of the points.

##Article Status
- A version of this interactive article, published on 4/13/16, is live on the RIT Media Sciences app.

##Code Status
1. The data for the industries of the different companies and co-ops should be updated to  to match the industries that the SMS faculty and management decide upon (similar to the smsDonutGraph's data).

2. The data that this article uses is stored in a local JSON object; we should have a copy stored on a database so that we can add to it and make changes to it easily in the future.

3. The 'filter-by-industry' filter option currently only eliminates locations if there are no co-op companies in the selected industries...it does not filter the companies at a specific location (there can be multiple companies at the same location, and if one company matches the industry filter selection, then all of the companies are still displayed when the user selects that point.

  - This should be resolved so that only the companies in the selected industry are displayed when a user selects a map point after applying an industry filter.
  
###Hayden's Recommendations

- The information display when a user clicks a point can be simplified.

  - The Google Maps API supports built-in 'tooltips' that I think could be used for this and would simplify the information display when a user clicks a point. 
  
- Currently the information that is displayed when a user clicks a point is limited to the city/state/country of that location and a list of companies (the names of the companies in the list will link to their website). We should try to keep the user in the app, and give them more options then visiting an outside website to learn more about the company.

  - A solution for this is to make the company list an accordion (or something similar) so that a user can click and industry and the list will expand to show a description of the selected co-op company.
  
  - This allows us to tailor the description to fit the co-ops that our students are doing (whereas just linking to the website of a large company can be ambigious and not helpful).
  
  - **Although**, this would take a great deal of work to update the dataset with a description of each company.
