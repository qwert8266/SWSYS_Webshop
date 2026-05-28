# Latest golang image on apline linux
FROM golang:1.26-alpine

# Work directory
WORKDIR /app

# Installing dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copying all the files
COPY *.go ./

# build the server
RUN CGO_ENABLED=0 GOOS=linux go build -o /docker-gs-ping

# Exposing server port
EXPOSE 8080

# Starting our application
CMD ["go", "run", "main.go"]