package com.nexus.identityservice.security;

import com.nexus.identityservice.service.UserLookupService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserLookupService userLookupService;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userLookupService.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }
}
