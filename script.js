let earningsInterval;
let isPaused = false;
let originalInputs = {};
let lastTimestamp = 0;
let earnings = 0.00;
let secondIncome = 0;
let startTimeInMillis;
let wasHidden = false;
let hiddenStartTime;
let totalPauseDuration = 0;
let pauseStartTime = 0;

function checkInputs() {
    const monthlyIncome = document.getElementById("monthlyIncome").value;
    const startTime = document.getElementById("startTime").value;
    const finishTime = document.getElementById("finishTime").value;
    const daysWorked = document.getElementById("daysWorked").value;
    const calculateButton = document.getElementById("calculate-button");

    calculateButton.disabled = true;

    const monthlyIncomeValue = parseFloat(monthlyIncome);
    const daysWorkedValue = parseInt(daysWorked, 10);

    if (monthlyIncome && startTime && finishTime && daysWorked) {
        if (monthlyIncomeValue >= 0 && daysWorkedValue >= 0 && daysWorkedValue <= 7) {
            calculateButton.disabled = false;
        }
    }
}

// Move updateEarnings to global scope
function updateEarnings() {
    if (!isPaused) {
        const currentTime = Date.now();
        const elapsedTime = currentTime - lastTimestamp; // Now in milliseconds
        earnings += (elapsedTime * secondIncome) / 1000; // Increment earnings by second income in £
        lastTimestamp = currentTime;

        // Update earnings display
        document.getElementById("earnings-value").innerText = `£${earnings.toFixed(2)}`;

        // Display elapsed time
        const totalElapsed = Math.floor((currentTime - startTimeInMillis - totalPauseDuration) / 1000);
        const hours = Math.floor(totalElapsed / 3600);
        const minutes = Math.floor((totalElapsed % 3600) / 60);
        const seconds = totalElapsed % 60;

        const formattedHours = String(hours).padStart(2, '0');
        const formattedMinutes = String(minutes).padStart(2, '0');
        const formattedSeconds = String(seconds).padStart(2, '0');

        document.getElementById("time-elapsed").innerText = `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
    }
}

document.addEventListener('DOMContentLoaded', function () {
    const calculateButton = document.getElementById("calculate-button");
    const resetButton = document.getElementById("reset-button");
    const setupContainer = document.getElementById("setup-container");
    const mainContainer = document.getElementById("main-container");
    const earningsContainer = document.getElementById("earnings-container");
    const earningsButtons = document.getElementById("earnings-buttons");

    document.getElementById("setup-form").addEventListener("submit", function (event) {
        if (calculateButton.disabled) {
            event.preventDefault();
        } else {
            event.preventDefault();

            document.getElementById("earnings-value").innerText = "£0.00"


            // Fetch the values from the form
            const monthlyIncome = parseFloat(document.getElementById("monthlyIncome").value);
            const startTime = document.getElementById("startTime").value;
            const finishTime = document.getElementById("finishTime").value;
            const daysWorked = parseInt(document.getElementById("daysWorked").value, 10);

            // Ensure all inputs are valid numbers before calculations
            if (isNaN(monthlyIncome) || isNaN(daysWorked)) {
                return;
            }

            // Calculate hours worked
            const start = new Date(`1970-01-01T${startTime}:00`);
            const finish = new Date(`1970-01-01T${finishTime}:00`);
            if (finish < start) finish.setDate(finish.getDate() + 1);
            const hoursWorked = (finish - start) / (1000 * 3600); // Convert to hours

            const currentDate = new Date();
            const numDaysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
            const numWeeksInMonth = numDaysInMonth / 7;

            const weeklyIncome = monthlyIncome / numWeeksInMonth;
            const dailyIncome = weeklyIncome / daysWorked;
            const totalHoursPerWeek = hoursWorked * daysWorked;
            const hourlyIncome = weeklyIncome / totalHoursPerWeek;

            const minuteIncome = hourlyIncome / 60;
            secondIncome = minuteIncome / 60;

            startTimeInMillis = Date.now();
            lastTimestamp = startTimeInMillis;

            // Start the earnings interval (update every 100 milliseconds)
            earningsInterval = setInterval(updateEarnings, 100);

            mainContainer.style.transition = "width 1s ease-in-out, min-height 1s ease-in-out";
            setupContainer.style.transition = "opacity 0.5s ease"; // Transition the opacity
            setupContainer.style.opacity = '0';

            setTimeout(function () {
                setupContainer.style.display = "none";

                mainContainer.classList.add("wider");
                setupContainer.classList.add("hidden");

                earningsContainer.style.display = "flex";
                earningsContainer.style.opacity = "0";

                // Hide the earnings buttons initially
                earningsButtons.style.display = "block";
                earningsButtons.style.opacity = "0";

                setTimeout(function () {
                    earningsContainer.style.opacity = "1";

                    // Fade in earnings buttons after earnings container is fully visible
                    setTimeout(function () {
                        earningsButtons.style.opacity = "1"; // Fade in the buttons
                    }, 0);
                }, 500);
            }, 0);
        }
    });

    document.getElementById("pause-button").addEventListener("click", function () {
        if (!isPaused) {
            // Pausing: Capture the start time for pause
            pauseStartTime = Date.now();
            clearInterval(earningsInterval); // Stop the interval
            this.innerText = "Resume";
        } else {
            // Resuming: Calculate total pause time and restart interval
            totalPauseDuration += Date.now() - pauseStartTime; // Add the pause duration
            lastTimestamp = Date.now(); // Reset last timestamp to now
            earningsInterval = setInterval(function () {
                updateEarnings();
            }, 100); // Restart the interval
            this.innerText = "Pause";
        }
        isPaused = !isPaused;
    });

    resetButton.addEventListener("click", function () {

        earningsContainer.style.display = "none";
        earningsButtons.style.display = "none";

        setupContainer.classList.remove("hidden");
        setupContainer.style.display = "block";
        setupContainer.style.opacity = '1';
        mainContainer.style.transition = "none";
        mainContainer.classList.remove("wider");

        clearInterval(earningsInterval);
        isPaused = false;
        earnings = 0.00;
        document.getElementById("earnings-value").innerText = `£${earnings.toFixed(2)}`;
        totalPauseDuration = 0; // Reset pause duration
        document.getElementById("pause-button").innerText = "Pause"
    });

    const inputFields = document.querySelectorAll("#setup-form input");
    inputFields.forEach(input => {
        input.addEventListener("input", checkInputs);
    });

    checkInputs();

    // Page Visibility API to handle when the user switches to another tab
    document.addEventListener("visibilitychange", function() {
        if (document.hidden) {
            // Page is hidden, store the hidden start time
            hiddenStartTime = Date.now();
            wasHidden = true;
        } else if (wasHidden) {
            // Page is visible again
            const hiddenEndTime = Date.now();
            const hiddenElapsed = hiddenEndTime - hiddenStartTime;

            const setupContainer = document.getElementById("setup-container");
            // Only add hidden elapsed time if the timer is running (not paused) and setup page is hidden
            if (!isPaused && setupContainer.style.display === "none") {
                earnings += (hiddenElapsed * secondIncome) / 1000;
                document.getElementById("earnings-value").innerText = `£${earnings.toFixed(2)}`;
                lastTimestamp = hiddenEndTime; // Update last timestamp to account for the time passed
            }

            wasHidden = false;
        }
    });
});
