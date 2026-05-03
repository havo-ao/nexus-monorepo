package com.nexus.identityservice.exception;


public class UserBannedException extends RuntimeException {
    public UserBannedException(String message) {
        super(message);
    }
}
