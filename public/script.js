document.addEventListener('DOMContentLoaded', async () => {
  try {
    // Fetch services and server information
    const [servicesResponse, serverInfoResponse] = await Promise.all([
      fetch('/services'),
      fetch('/server-info')
    ]);

    if (!servicesResponse.ok || !serverInfoResponse.ok) {
      throw new Error('Failed to fetch data');
    }

    const services = await servicesResponse.json();
    const serverInfo = await serverInfoResponse.json();

    // Display server information
    const serverInfoDiv = document.getElementById('server-info');
    const serverInfoHtml = `
      <h3 class="text-2xl font-bold mb-4 text-gray-800 group-hover:text-gray-50">Server Information</h3>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>Hostname:</strong> ${serverInfo.hostname}</p>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>Platform:</strong> ${serverInfo.platform}</p>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>Uptime:</strong> ${Math.floor(serverInfo.uptime / 60)} minutes</p>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>Load Average:</strong> ${serverInfo.loadavg.map(n => n.toFixed(2)).join(', ')}</p>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>Total Memory:</strong> ${(serverInfo.totalmem / 1024 / 1024).toFixed(2)} MB</p>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>Free Memory:</strong> ${(serverInfo.freemem / 1024 / 1024).toFixed(2)} MB</p>
      <p class="text-gray-700 group-hover:text-gray-200"><strong>CPU:</strong> ${serverInfo.cpus[0].model} (${serverInfo.cpus.length} cores)</p>
    `;
    serverInfoDiv.innerHTML = serverInfoHtml;

    // Group services by category
    const servicesByCategory = services.reduce((acc, service) => {
      if (!acc[service.category]) {
        acc[service.category] = [];
      }
      acc[service.category].push(service);
      return acc;
    }, {});

    // Display services grouped by category
    const servicesList = document.getElementById('services-list');
    const overviewCards = document.querySelector('.grid-cols-1'); // Assuming this class is unique to overview cards
    const overviewText = document.querySelectorAll('.overview-text'); // Assuming this class is used for overview text

    const displayServices = (filteredServicesByCategory) => {
      servicesList.innerHTML = '';
      for (const [category, services] of Object.entries(filteredServicesByCategory)) {
        const categoryHtml = `
          <h3 class="text-2xl font-bold mb-4 text-gray-800">${category}</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
            ${services.map(service => {
              const statusColor = service.status === 'Running' ? 'text-green-500' : 'text-red-500';
              return `
                <div class="card bg-white rounded-xl shadow-lg p-6 flex flex-col justify-between group">
                  <div class="flex flex-row justify-between items-center">
                    <div class="logo">
                      <img src="${service.logo}" alt="${service.name} logo" class="w-16 h-16 object-cover">
                    </div>
                    <div class="inline-flex text-sm text-gray-600 group-hover:text-gray-200 sm:text-base">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 mr-2 ${statusColor} group-hover:text-gray-200"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                        <path stroke-linecap="round" stroke-linejoin="round" d="M15 12H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      ${service.status}
                    </div>
                  </div>
                  <h1 class="text-2xl sm:text-3xl font-bold text-gray-700 mt-8 group-hover:text-gray-50">${service.name}</h1>
                  <p class="text-gray-600 mt-2 group-hover:text-gray-50">${service.description}</p>
                  <div class="mt-3 flex justify-end space-x-2">
                    <a href="${service.customUrl}" target="_blank" class="btn px-4 py-2 rounded-full inline-flex items-center">
                      Open
                    </a>
                   <button data-modal-target="edit-service-modal" data-modal-toggle="edit-service-modal" data-service-id="${service._id}" class="btn px-4 py-2 rounded-full bg-blue-700 text-white hover:bg-blue-800 focus:ring-4 focus:ring-blue-300">
                  Edit
                </button>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;
        servicesList.insertAdjacentHTML('beforeend', categoryHtml);
      }
    };
    

    displayServices(servicesByCategory);

    // Update clock every second
    const updateClock = () => {
      const now = new Date();
      const hours = now.getHours() % 12 || 12;
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
      const timeString = `${hours}:${minutes} ${ampm}`;
      const dateString = now.toLocaleDateString();
      document.getElementById('current-time').textContent = timeString;
      document.getElementById('current-date').textContent = dateString;
    };

    setInterval(updateClock, 1000);
    updateClock(); // Initial call to display time immediately

    // Search function
    const searchInputDesktop = document.getElementById('search-navbar-desktop');
    const searchInputMobile = document.getElementById('search-navbar-mobile');

    const searchFunction = (event) => {
      // Ensure event.target and event.target.value are defined
      const searchText = (event.target && event.target.value) ? event.target.value.toLowerCase() : '';
      const filteredServicesByCategory = {};
    
      for (const [category, services] of Object.entries(servicesByCategory)) {
        const filteredServices = services.filter(service => service.name.toLowerCase().includes(searchText));
        if (filteredServices.length > 0) {
          filteredServicesByCategory[category] = filteredServices;
        }
      }
    
      displayServices(filteredServicesByCategory);
    
      // Debugging: Check visibility of overview sections
      console.log('Search Text:', searchText);
      console.log('Filtered Services:', filteredServicesByCategory);
    
      // Hide or show overview cards and text based on search input
      if (searchText.trim() === '') {
        overviewCards.style.display = 'grid';
        overviewText.forEach(text => text.style.display = 'block');
      } else {
        overviewCards.style.display = 'none';
        overviewText.forEach(text => text.style.display = 'none');
      }
    };

    searchInputDesktop.addEventListener('input', searchFunction);
    searchInputMobile.addEventListener('input', searchFunction);

  } catch (error) {
    console.error('Error fetching data:', error);
  }
});

document.addEventListener('DOMContentLoaded', () => {
  const serviceForm = document.getElementById('service-form');

  serviceForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const formData = new FormData(serviceForm);
    const url = formData.get('url');
    const customUrl = formData.get('customUrl') || url; // Set customUrl to url if not provided

    const data = {
      name: formData.get('name'),
      url: url,
      description: formData.get('description'),
      logo: formData.get('logo'),
      customUrl: customUrl,
      category: formData.get('category')
    };

    try {
      const response = await fetch('/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        alert('Service added successfully!');
        serviceForm.reset();
        // Close the modal
        const modal = document.getElementById('service-modal');
        if (modal) {
          modal.classList.add('hidden');
        }
        // Refresh the page
        location.reload();
      } else {
        alert('Failed to add service. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    }
  });
});
