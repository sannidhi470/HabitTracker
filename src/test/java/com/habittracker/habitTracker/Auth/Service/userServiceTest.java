package com.habittracker.habitTracker.Auth.Service;

import com.habittracker.habitTracker.Auth.Model.User;
import com.habittracker.habitTracker.Auth.repository.userRepo;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Mockito;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;


@ExtendWith(MockitoExtension.class)
class userServiceTest {
static User user = null;
    @BeforeAll
    public static void createUser(){
         user = new User();
        user.setEmail("sanni");
        user.setPassword("encoded");
        user.setFullName("sannidhi");
        user.setId(1);
    }
    @Mock
    userRepo userrepo;
    @Mock
    BCryptPasswordEncoder bCryptPasswordEncoder;
    @InjectMocks
    userService userService;


    @Test
    void signup() {
        Mockito.when(bCryptPasswordEncoder.encode(user.getPassword())).thenReturn("encoded");
        Mockito.when(userrepo.save(user)).thenReturn(user);
        User user1 = userService.signup(user);
        assertEquals(user.getEmail(), user1.getEmail());
        assertEquals(user.getPassword(), user1.getPassword());
    }

    @Test
    void login() {
        Mockito.when(userrepo.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        Mockito.when(bCryptPasswordEncoder.matches("sanni","encoded")).thenReturn(true);
        User user1 = userService.login(user.getEmail(), "sanni");
        assertEquals(user.getEmail(), user1.getEmail());
        assertEquals(user.getPassword(), user1.getPassword());

    }

    @Test
    void loginNegative(){
        User user = new User();
        Mockito.when(userrepo.findByEmail(user.getEmail())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.login(user.getEmail(), user.getPassword()));
        assertEquals(exception.getMessage(),"Email or password incorrect");

    }

    @Test
    void saveUser() {
        Mockito.when(userrepo.save(user)).thenReturn(user);
        userService.saveUser(user);
        Mockito.verify(userrepo,Mockito.times(1)).save(user);
    }

    @Test
    void getUserById() {

        Mockito.when(userrepo.findById(user.getId())).thenReturn(Optional.of(user));
        User user1 = userService.getUserById(user.getId());
        assertEquals(user.getEmail(), user1.getEmail());
    }

    @Test
    void getUserByIdNegative() {
        User user = new User();
        user.setId(1);
        Mockito.when(userrepo.findById(user.getId())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.getUserById(user.getId()));
        assertEquals(exception.getMessage(),"User not found");
    }

    @Test
    void getUserByEmail() {
        Mockito.when(userrepo.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        User user1 = userService.getUserByEmail(user.getEmail());
        assertEquals(user.getEmail(), user1.getEmail());
    }

    @Test
    void getUserByEmailNegative() {
        User user = new User();
        Mockito.when(userrepo.findByEmail(user.getEmail())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.getUserByEmail(user.getEmail()));
        assertEquals(exception.getMessage(),"User not found");
    }

    @Test
    void getAllUsers() {
        User user1 = new User();
        user1.setEmail("sanni");
        User user2 = new User();
        user2.setEmail("sannidhi");
        List<User> list = new ArrayList<>();
        list.add(user1);
        list.add(user2);
        Mockito.when(userrepo.findAll()).thenReturn(list);
        List<User> users = userService.getAllUsers();
        assertEquals(users.size(),list.size());
        Mockito.verify(userrepo,Mockito.times(1)).findAll();
    }

    @Test
    void getUserId() {
        Mockito.when(userrepo.findByEmail(user.getEmail())).thenReturn(Optional.of(user));
        Long id = userService.getUserId(user.getEmail());
        assertEquals(user.getId(), id);
    }

    @Test
    void getUserIdNegative() {
        User user = new User();
        Mockito.when(userrepo.findByEmail(user.getEmail())).thenReturn(Optional.empty());
        RuntimeException exception = assertThrows(RuntimeException.class, () -> userService.getUserId(user.getEmail()));
        assertEquals(exception.getMessage(),"User not found");
    }
}