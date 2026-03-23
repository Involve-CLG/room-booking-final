let selectedRoom = null;
let selectedSlots = [];

/* ================= ROOM SELECTION ================= */

function selectRoom(roomName) {

    selectedRoom = roomName;
    selectedSlots = [];

    document.getElementById("bookingSection").style.display = "block";

    document.querySelectorAll(".room-card").forEach(card => {
        card.classList.remove("selected-room");
    });

    if (roomName === "Board Room") {
        document.getElementById("boardRoomCard").classList.add("selected-room");
    } else {
        document.getElementById("conferenceHallCard").classList.add("selected-room");
    }

    generateSlots();
}


/* ================= SLOT GENERATION ================= */

function generateSlots() {

    const container = document.getElementById("slotsContainer");
    container.innerHTML = "";

    const bookingDate = document.getElementById("bookingDate").value;
    if (!bookingDate) return;

    const selectedDate = new Date(bookingDate);
    const today = new Date();

    const day = selectedDate.getDay();

    const timeSlots = [
        "9:00 - 10:00",
        "10:00 - 11:00",
        "11:00 - 12:00",
        "12:00 - 13:00",
        "13:00 - 14:00",
        "14:00 - 15:00",
        "15:00 - 16:00",
        "16:00 - 17:00"
    ];

    timeSlots.forEach(slot => {

        const button = document.createElement("button");
        button.innerText = slot;
        button.classList.add("slot");
        button.dataset.slot = slot;

        const slotHour = parseInt(slot.split(":")[0]);

        // Past date
        if (selectedDate < new Date(today.toDateString())) {
            button.classList.add("unavailable");
            button.disabled = true;
        }

        // Sunday (Unavailable)
        else if (day === 0) {
            button.classList.add("unavailable");
            button.disabled = true;
        }

        // Saturday (Already Booked)
        else if (day === 6) {
            button.classList.add("booked");
            button.disabled = true;
        }

        // Past time today
        else if (
            selectedDate.toDateString() === today.toDateString() &&
            slotHour <= today.getHours()
        ) {
            button.classList.add("unavailable");
            button.disabled = true;
        }

        button.addEventListener("click", function () {
            toggleSlot(this);
        });

        container.appendChild(button);
    });

    loadBookedSlots();
}


/* ================= SLOT SELECTION ================= */

function toggleSlot(button) {

    if (button.classList.contains("booked") ||
        button.classList.contains("unavailable")) {
        return;
    }

    const slotValue = button.dataset.slot;

    if (selectedSlots.includes(slotValue)) {
        selectedSlots = selectedSlots.filter(s => s !== slotValue);
        button.classList.remove("selected");
    } else {
        selectedSlots.push(slotValue);
        button.classList.add("selected");
    }
}


/* ================= LOAD BOOKED SLOTS FROM DB ================= */

function loadBookedSlots() {

    if (!selectedRoom) return;

    const bookingDate = document.getElementById("bookingDate").value;
    if (!bookingDate) return;

    fetch(`/get-bookings?room=${selectedRoom}&date=${bookingDate}`)
    .then(res => res.json())
    .then(bookedSlots => {

        document.querySelectorAll(".slot").forEach(button => {

            const slotValue = button.dataset.slot;

            if (bookedSlots.includes(slotValue)) {
                button.classList.remove("selected");
                button.classList.add("booked");
                button.disabled = true;
            }
        });
    });
}


/* ================= CONFIRM BOOKING ================= */

function confirmBooking() {

    if (!selectedRoom) {
        alert("Please select a room");
        return;
    }

    if (selectedSlots.length === 0) {
        alert("Please select at least one time slot");
        return;
    }

    const name = document.getElementById("customerName").value.trim();
    const email = document.getElementById("customerEmail").value.trim();
    const organization = document.getElementById("organizationName").value.trim();
    const phone = document.getElementById("phoneNumber").value.trim();
    const specialRequest = document.getElementById("specialRequest").value.trim();

    const insurance = document.querySelector('input[name="insurance"]:checked');

    if (!name || !email || !organization || !phone || !specialRequest || !insurance) {
        alert("Please fill all fields");
        return;
    }

    const bookingDate = document.getElementById("bookingDate").value;

    fetch("/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            room: selectedRoom,
            date: bookingDate,
            slots: selectedSlots,
            name: name,
            email: email,
            organization: organization,
            phone: phone,
            insurance: insurance.value,
            special_request: specialRequest
        })
    })
    .then(res => res.json())
    .then(data => {

        if (data.success) {
            alert("Your Provisional booking is done✅");
            alert("One of our team member will call you shortly to confirm same.");
            alert("Thank you!");

            selectedSlots = [];
            generateSlots();  // refresh UI
        } else {
            alert("Server error");
        }
    })
    .catch(() => {
        alert("Server error");
    });
}


/* ================= DATE CHANGE EVENT ================= */

document.getElementById("bookingDate").addEventListener("change", function () {
    if (selectedRoom) {
        generateSlots();
    }
});