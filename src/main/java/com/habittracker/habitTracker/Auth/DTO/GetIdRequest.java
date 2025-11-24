package com.habittracker.habitTracker.Auth.DTO;

public class GetIdRequest {
    private String email;
    public GetIdRequest() {}
    public GetIdRequest(String email) {
        this.email = email;
    }
    public String getEmail() {
        return email;
    }
    public void setEmail(String email) {
        this.email = email;
    }

}
