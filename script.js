// Handle fade-in effect on scroll
document.addEventListener("scroll", function () {
    let sections = document.querySelectorAll(".fade-section");
    sections.forEach((section) => {
        let rect = section.getBoundingClientRect();
        let fadePoint = window.innerHeight * 0.75; // Adjust for earlier fade-in
        if (rect.top < fadePoint) {
            let opacity = (fadePoint - rect.top) / fadePoint;
            section.style.opacity = Math.min(opacity, 1); // Ensure opacity doesn't exceed 1
        }
    });
});

let lastScrollTop = 0;
const navbar = document.getElementById("navbar");
const menuToggle = document.querySelector(".menu-toggle"); // Declare the variable once here
const navList = document.querySelector("nav ul");

// Change navbar background when scrolling up or down
window.addEventListener("scroll", function () {
    let currentScroll = window.scrollY;

    if (currentScroll > lastScrollTop) {
        navbar.classList.add("scrolled");
    } else {
        navbar.classList.remove("scrolled");
    }

    lastScrollTop = currentScroll;
});



// JavaScript for toggling the hamburger menu
document.getElementById("hamburger-toggle").addEventListener("click", function() {
    // Select the menu
    const menu = document.querySelector(".menu");

    // Toggle the 'display' property of the menu
    if (menu.style.display === "block") {
        menu.style.display = "none";  // Hide the menu if it's currently visible
    } else {
        menu.style.display = "block";  // Show the menu if it's currently hidden
    }
});




// Restrict date input to only Saturdays and Sundays
document.getElementById('date').addEventListener('input', function () {
    const dateInput = document.getElementById('date');
    const selectedDate = new Date(dateInput.value);
    const dayOfWeek = selectedDate.getDay();

    // If the day is not Saturday (6) or Sunday (0), reset the date input
    if (dayOfWeek !== 6 && dayOfWeek !== 0) {
        alert('Appointments can only be booked on Saturday or Sunday.');
        dateInput.value = ''; // Reset the date input
    }
});

// Function to format time from 24-hour format (HH:mm) to 12-hour format (h:mm AM/PM)
function formatTimeTo12Hour(time) {
    const [hours, minutes] = time.split(":");
    let formattedHours = parseInt(hours, 10);
    const suffix = formattedHours >= 12 ? 'PM' : 'AM';

    if (formattedHours > 12) {
        formattedHours -= 12; // Convert 24-hour to 12-hour format
    } else if (formattedHours === 0) {
        formattedHours = 12; // Handle midnight (00:00)
    }

    return `${formattedHours}:${minutes} ${suffix}`;
}

// Function to format the date as dd/mm/yyyy
function formatDate(date) {
    const selectedDate = new Date(date);
    const day = selectedDate.getDate().toString().padStart(2, '0'); // Ensure day is two digits
    const month = (selectedDate.getMonth() + 1).toString().padStart(2, '0'); // Ensure month is two digits
    const year = selectedDate.getFullYear();
    return `${day}/${month}/${year}`; // Format as dd/mm/yyyy
}

// Function to combine date and time into one string (e.g., dd/mm/yyyy hh:mm AM/PM)
function combineDateAndTime(date, time) {
    const formattedDate = formatDate(date);
    const formattedTime = formatTimeTo12Hour(time);
    return `${formattedDate} ${formattedTime}`; // Combine date and time
}

// Appointment booking logic
document.getElementById("appointment-form").addEventListener("submit", async (e) => {
    e.preventDefault();

    // Get form values
    const name = document.getElementById("name").value.trim();
    const phone = document.getElementById("phone").value.trim();
    const date = document.getElementById("date").value.trim();
    const time = document.getElementById("time").value.trim();
    const message = document.getElementById("message").value.trim() || "No message provided";

    // Validate input fields
    if (!name || !phone || !date || !time) {
        alert("Please fill in all required fields.");
        return;
    }

    // Ensure the selected time is not after 5 PM
    const selectedTime = new Date(`1970-01-01T${time}:00`);
    const maxTime = new Date('1970-01-01T17:00:00');
    if (selectedTime > maxTime) {
        alert("Appointments can only be booked between 08:00 AM and 05:00 PM.");
        return;
    }

    // Check if the date is a Sunday or Saturday
    const selectedDateObj = new Date(date);
    if (selectedDateObj.getDay() !== 0 && selectedDateObj.getDay() !== 6) {
        alert("Appointments can only be booked on Saturdays and Sundays.");
        return;
    }

    try {
        // Fetch existing appointments from SheetDB to check for double bookings
        const response = await fetch('https://sheetdb.io/api/v1/vqe73unkshywj');
        const appointments = await response.json();

        // Check if the selected date and time is already booked
        const isDoubleBooking = appointments.some(appointment => {
            return appointment.date === combineDateAndTime(date, time); // Check both date and time
        });

        if (isDoubleBooking) {
            alert("This time slot is already booked. Please choose another time.");
            return;
        }

        // Check if the same person (name and email) has already booked an appointment
        const isAlreadyBookedByUser = appointments.some(appointment => {
            return appointment.name === name;
        });

        if (isAlreadyBookedByUser) {
            alert("You have already booked an appointment. You cannot book more than one appointment.");
            return;
        }

        // Combine the date and time into one string before sending to the API
        const combinedDateTime = combineDateAndTime(date, time);

        // Send the new appointment data to the Google Sheets via SheetDB API
        const postResponse = await fetch('https://sheetdb.io/api/v1/vqe73unkshywj', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                data: [{
                    name,
                    phone,
                    date: combinedDateTime, // Use the combined date and time
                    message
                }]
            })
        });

        const postData = await postResponse.json();

        if (postResponse.ok) {
            alert("Appointment booked successfully!");
            document.getElementById("appointment-form").reset();
            document.getElementById("confirmationMessage").style.display = "block"; // Show confirmation message
        } else {
            alert(postData.error || "Error booking appointment.");
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Error booking appointment. Try again.");
    }
});
