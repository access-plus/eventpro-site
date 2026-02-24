package com.accessplus.eventpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication(scanBasePackages = "com.accessplus.eventpro")
@EnableScheduling
public class EventProApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventProApplication.class, args);
	}

}

