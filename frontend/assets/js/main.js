// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Contact form handling
const contactForm = document.getElementById('contact-form');
const formResponse = document.getElementById('form-response');
const responseMessage = formResponse.querySelector('.response-message');

contactForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    // Show loading state
    const submitBtn = contactForm.querySelector('.submit-btn');
    const originalBtnText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="prompt">$</span> Sending...';
    submitBtn.disabled = true;
    
    // Get form data
    const formData = {
        name: contactForm.querySelector('#name').value,
        email: contactForm.querySelector('#email').value,
        message: contactForm.querySelector('#message').value
    };
    
    try {
        const response = await fetch('/api/contact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        const data = await response.json();
        
        if (response.ok) {
            // Show success message
            formResponse.classList.remove('hidden', 'error');
            formResponse.classList.add('success');
            responseMessage.textContent = data.message || 'Message sent successfully! I will get back to you soon.';
            
            // Reset form
            contactForm.reset();
        } else {
            throw new Error(data.error || 'Failed to send message');
        }
    } catch (error) {
        // Show error message
        formResponse.classList.remove('hidden', 'success');
        formResponse.classList.add('error');
        responseMessage.textContent = error.message || 'Failed to send message. Please try again later.';
    } finally {
        // Reset button state
        submitBtn.innerHTML = originalBtnText;
        submitBtn.disabled = false;
        
        // Scroll response into view
        formResponse.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
});

// Add active class to nav links on scroll
window.addEventListener('scroll', () => {
    let current = '';
    const sections = document.querySelectorAll('section');
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= sectionTop - sectionHeight / 3) {
            current = section.getAttribute('id');
        }
    });

    document.querySelectorAll('.nav-links a').forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === current) {
            link.classList.add('active');
        }
    });
});

// Function to fetch portfolio data from backend
async function fetchPortfolio() {
    try {
        const response = await fetch('http://localhost:5000/api/portfolio');
        const projects = await response.json();
        displayProjects(projects);
    } catch (error) {
        console.error('Error fetching portfolio:', error);
        displayError();
    }
}

// Function to display projects in terminal style
function displayProjects(projects) {
    const portfolioContainer = document.querySelector('.projects-grid');
    portfolioContainer.innerHTML = ''; // Clear existing content

    projects.forEach(project => {
        const projectHTML = createProjectHTML(project);
        portfolioContainer.innerHTML += projectHTML;
    });

    // Add event listeners to read more buttons
    addReadMoreListeners();
}

// Function to create HTML for a single project
function createProjectHTML(project) {
    const structureHTML = createStructureHTML(project.structure);
    const languagesHTML = createLanguagesHTML(project.languages);
    
    return `
        <div class="terminal-project">
            <div class="terminal-header">
                <span class="terminal-title">~/projects/${project.name}</span>
                <div class="terminal-buttons">
                    <span class="terminal-button-red"></span>
                    <span class="terminal-button-yellow"></span>
                    <span class="terminal-button-green"></span>
                </div>
            </div>
            <div class="terminal-content">
                <div class="project-title">
                    <span class="terminal-prompt">$</span> ls ${project.name}/
                </div>
                <div class="project-structure">
                    <pre>${structureHTML}</pre>
                </div>
                <div class="project-info">
                    <div class="command-output">
                        <span class="prompt">$</span> cat README.md
                        <div class="output">
                            # ${project.name}
                            ${project.description || 'No description available'}
                            ${project.topics.map(topic => `• ${topic}`).join('\n')}
                        </div>
                        <div class="project-details hidden">
                            <br>## Technical Details
                            ${languagesHTML}
                            <br>## Project Stats
                            • Created: ${new Date(project.created_at).toLocaleDateString()}
                            • Last Updated: ${new Date(project.updated_at).toLocaleDateString()}
                            • Stars: ${project.stargazers_count}
                            
                            ## Repository
                            • URL: ${project.url}
                        </div>
                        <button class="read-more-btn">
                            <span class="prompt">$</span> more details
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Function to create HTML for project structure
function createStructureHTML(structure) {
    return structure
        .map(item => {
            const icon = item.type === 'dir' ? '📁' : '📄';
            return `${icon} ${item.name}`;
        })
        .join('\n');
}

// Function to create HTML for languages section
function createLanguagesHTML(languages) {
    const total = Object.values(languages).reduce((a, b) => a + b, 0);
    return Object.entries(languages)
        .map(([lang, bytes]) => {
            const percentage = ((bytes / total) * 100).toFixed(1);
            return `• ${lang}: ${percentage}%`;
        })
        .join('\n');
}

// Function to display error message
function displayError() {
    const portfolioContainer = document.querySelector('.projects-grid');
    portfolioContainer.innerHTML = `
        <div class="terminal-error">
            <span class="prompt">$</span> Error: Failed to fetch portfolio data
            <br>
            <span class="prompt">$</span> Please try again later...
        </div>
    `;
}

// Function to add event listeners to read more buttons
function addReadMoreListeners() {
    const readMoreBtns = document.querySelectorAll('.read-more-btn');
    readMoreBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const projectDetails = btn.parentNode.querySelector('.project-details');
            if (projectDetails.classList.contains('hidden')) {
                projectDetails.classList.remove('hidden');
                btn.innerHTML = '<span class="prompt">$</span> less details';
            } else {
                projectDetails.classList.add('hidden');
                btn.innerHTML = '<span class="prompt">$</span> more details';
            }
        });
    });
}

// Fetch portfolio data when the page loads
document.addEventListener('DOMContentLoaded', fetchPortfolio);
