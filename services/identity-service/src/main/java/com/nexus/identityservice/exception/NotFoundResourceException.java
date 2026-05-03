package com.nexus.identityservice.exception;

import java.io.Serial;

public class NotFoundResourceException extends RuntimeException{


    @Serial
    private static final long serialVersionUID = 1L;

    public NotFoundResourceException(String msg) {
        super(msg);
    }

}
