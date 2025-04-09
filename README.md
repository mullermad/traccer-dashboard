# Local Device Tracker Dashboard

## Objective

Set up Traccar locally, simulate device locations, and create a simple web dashboard to display real-time device positions using Traccar's REST API.

---

## Setup Instructions

### 1. Install and Run Traccar Server Locally

1. **Download Traccar**:  
   Download the Traccar installer from [https://www.traccar.org/download/]

2. **Extract the downloaded file** to a directory of your choice.

3. **Run Traccar** using the following command:

   ```bash
   sudo systemctl start traccar
   ```

   Access the Traccar web interface at http://localhost:8082.

4. **Send Sample Location Data:**
   Use the following curl command to send mock data to your Traccar server:

````curl -G "http://localhost:5055" \
 --data-urlencode "id=1234567653" \
 --data-urlencode "lat=9.0344" \
 --data-urlencode "lon=38.7621" \
 --data-urlencode "speed=20" \
 --data-urlencode "bearing=90" \
 --data-urlencode "altitude=150" \
 --data-urlencode "timestamp=$(date +%s000)"```
````

device id are 1234567653,123456789012345 and 987654321098765 are mock device id i inserted

5. **Clone the Web Dashboard Repository:**
   git clone `https://github.com/mullermad/traccer-dashboard`
   cd traccer-dashboard

6. **Install Dependencies:**

   ```bash
      npm install
   ```

7. **Run the Development Server:**

```bash
   npm run dev
```

finally Open the dashboard at http://localhost:5183/ in your browser.

8. **In assets folder there is screenshoots of the web app**
