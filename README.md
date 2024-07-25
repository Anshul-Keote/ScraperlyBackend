# Sraperly Backend

Server Component of Scraperly!

# Process to Install on a Fresh Instance:

## 1. Install Node

`sudo yum update -y `

`curl -sL https://rpm.nodesource.com/setup_21.x | sudo bash -`

`sudo yum install -y nodejs`

## 2. Verify if node is installed

`node -v`

## 3. Install yarn

`sudo npm install --global yarn`

## 4. Install git

`yum install git`

## 5. Clone the repo

`git clone https://github.com/Anshul-Keote/ScraperlyBackend.git `

## 6. Go to the folder 

`cd ScraperlyBackend/`

## 7. Install using yarn

`yarn`

## 8. Run the project using npm

`sudo npm run dev`

# !!! Server Set !!!!

# API Endpoints- 

## 1. http:{Public IP of the Instance}/api/v1/createOrder 

### send POST from Tally form

## 2. http:{Public IP of the Instance}/api/v1/startOrder

### send POST with {"id" = "{OrderID}"}

## 3. http:{Public IP of the Instance}/api/v1/generateCSV

### send POST with {"id" = "{OrderID}"}

