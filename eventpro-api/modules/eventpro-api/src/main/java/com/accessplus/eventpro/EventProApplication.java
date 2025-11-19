package com.accessplus.eventpro;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.accessplus.eventpro")
public class EventProApplication {

	public static void main(String[] args) {
		SpringApplication.run(EventProApplication.class, args);
	}

}

