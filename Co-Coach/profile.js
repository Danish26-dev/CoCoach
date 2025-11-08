const profileForm = document.getElementById('profileForm');
const errorBar = document.getElementById('errorBar');
const successBar = document.getElementById('successBar');
const logoutBtn = document.getElementById('logoutBtn');

function show(el, text) {
    if (!el) return;
    el.textContent = text;
    el.classList.add('show');
}

function hide(el) {
    if (!el) return;
    el.classList.remove('show');
    el.textContent = '';
}

function getFormValues() {
    return {
        name: document.getElementById('name').value.trim(),
        age: Number(document.getElementById('age').value),
        weight: Number(document.getElementById('weight').value),
        height: Number(document.getElementById('height').value),
        gender: document.getElementById('gender').value,
        sports: document.getElementById('sports').value,
        injuryFlag: document.getElementById('injuryFlag').value,
        injuryDetails: document.getElementById('injuryDetails').value.trim(),
    };
}

function validate(values) {
    if (!values.name) return 'Name is required';
    if (!values.age || values.age < 5 || values.age > 100) return 'Age must be between 5 and 100';
    if (!values.weight || values.weight < 20) return 'Please enter a valid weight';
    if (!values.height || values.height < 80) return 'Please enter a valid height';
    if (!values.gender) return 'Please select a gender';
    if (!values.injuryFlag) return 'Please select if you have injuries';
    if (values.injuryFlag === 'yes' && !values.injuryDetails) return 'Please add injury details';
    return '';
}

// Prefill if profile already exists
try {
    const saved = JSON.parse(localStorage.getItem('twc_profile') || 'null');
    if (saved) {
        document.getElementById('name').value = saved.name || '';
        document.getElementById('age').value = saved.age || '';
        document.getElementById('weight').value = saved.weight || '';
        document.getElementById('height').value = saved.height || '';
        document.getElementById('gender').value = saved.gender || '';
        document.getElementById('sports').value = saved.sports || '';
        if (saved.injuryFlag) {
            document.getElementById('injuryFlag').value = saved.injuryFlag;
        }
        if (saved.injuryFlag === 'yes') {
            document.getElementById('injuryDetailsWrap').style.display = 'block';
        }
        document.getElementById('injuryDetails').value = saved.injuryDetails || '';
    }
} catch {}

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    hide(errorBar); hide(successBar);

    const values = getFormValues();
    const err = validate(values);
    if (err) {
        show(errorBar, err);
        return;
    }

    try {
        localStorage.setItem('twc_profile', JSON.stringify(values));
        show(successBar, 'Profile saved! Redirecting to avatar...');
        setTimeout(() => {
            window.location.href = 'avatar.html';
        }, 700);
    } catch (e2) {
        show(errorBar, 'Failed to save profile locally.');
    }
});

logoutBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Toggle injury details based on Yes/No dropdown
const injuryFlag = document.getElementById('injuryFlag');
const injuryDetailsWrap = document.getElementById('injuryDetailsWrap');
injuryFlag.addEventListener('change', () => {
    if (injuryFlag.value === 'yes') {
        injuryDetailsWrap.style.display = 'block';
    } else {
        injuryDetailsWrap.style.display = 'none';
        document.getElementById('injuryDetails').value = '';
    }
});


