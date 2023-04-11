# Use the official Python image as base image
FROM python:3.9-slim

# Set the working directory
WORKDIR /app

# Copy requirements file
COPY requirements.txt .

# Install required packages
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Copy the Python script
COPY 1_scraping.py .

# Set up Chrome WebDriver and install dependencies
RUN apt-get update && \
    apt-get install -y wget curl unzip gnupg && \
    wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - && \
    echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google.list && \
    apt-get update && \
    apt-get install -y google-chrome-stable && \
    CHROMEDRIVER_VERSION=`curl -sS chromedriver.storage.googleapis.com/LATEST_RELEASE` && \
    wget https://chromedriver.storage.googleapis.com/$CHROMEDRIVER_VERSION/chromedriver_linux64.zip && \
    unzip chromedriver_linux64.zip && \
    mv chromedriver /usr/local/bin/chromedriver && \
    chmod +x /usr/local/bin/chromedriver && \
    rm chromedriver_linux64.zip && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Run the script
CMD ["python", "./1_scraping.py"]
