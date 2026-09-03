# Build stage
FROM eclipse-temurin:17-jdk-alpine AS build
WORKDIR /app
COPY mvnw .
COPY .mvn .mvn
COPY pom.xml .
RUN chmod +x ./mvnw
COPY src src
RUN ./mvnw package -DskipTests

# Run stage
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080 10000
ENV PORT=8080
ENTRYPOINT ["sh", "-c", "java -Xmx384m -Xms128m -Djava.net.preferIPv4Stack=true -Djava.security.egd=file:/dev/./urandom -Dserver.address=0.0.0.0 -Dserver.port=${PORT:-8080} -jar app.jar"]

