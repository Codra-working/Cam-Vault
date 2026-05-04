FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
COPY src src
RUN ./mvnw -DskipTests package

FROM eclipse-temurin:25-jdk AS dev
WORKDIR /app
ENV TZ=Asia/Seoul
COPY .mvn .mvn
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw && chmod +x mvnw
CMD ["./mvnw", "spring-boot:run"]

FROM eclipse-temurin:25-jre AS runtime
WORKDIR /app
ENV TZ=Asia/Seoul
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
