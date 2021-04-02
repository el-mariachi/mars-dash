# Functional Programming with Javascript 

## mission MARS nasa

Index page displays three Mars rovers with their preview and info. 
Info contains Launch Date, Landing Date and Status. 
Date of the photos is shown on the full-screen preview of each image.
Click on the rover preview to bring up the corresponding rover's image gallery.
The gallery is opened to the max martian sol of each rover.
Use arrows next to the sol number in the header to select an earlier/later sol.
The gallery display is limited by 25 images per page. If there are more than 25
images available for a particular sol, an appropriate button is rendered. 
Click on that button to show more images. Click on an image thumbnail
to view a full-size version. 
Click the bottom-right corner of the footer on the index page to view the Astronomy Picture of the Day.

### Instructions

- ```npm install```
- [Obtain yout personal API key from NASA](https://api.nasa.gov/#browseAPI)
- Create a file named ```.env``` in the project root with following contents: ```API_KEY=<your_key>```
- ```npm start``` to start the server
- Go to ```localhost:3000```