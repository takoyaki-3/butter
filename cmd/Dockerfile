# Use the official Python image as base image
FROM python:3.9-slim

# Install Golang
ENV GOLANG_VERSION 1.19
RUN apt-get update && \
    apt-get install -y --no-install-recommends wget gcc && \
    wget https://golang.org/dl/go${GOLANG_VERSION}.linux-amd64.tar.gz && \
    tar -C /usr/local -xzf go${GOLANG_VERSION}.linux-amd64.tar.gz && \
    rm go${GOLANG_VERSION}.linux-amd64.tar.gz && \
    apt-get remove -y wget && \
    apt-get autoremove -y && \
    rm -rf /var/lib/apt/lists/*
ENV PATH $PATH:/usr/local/go/bin

# Set the working directory
WORKDIR /app

RUN apt-get update && apt-get install -y build-essential

# Copy requirements file
COPY * .
COPY helper /app/helper

# Install required packages
RUN pip install --trusted-host pypi.python.org -r requirements.txt

# Run the script
CMD ["bash", "./cmd.sh"]
