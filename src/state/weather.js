export const weather = {
    enabled: localStorage.getItem('wxEnabled') !== '0',
    code: null,
    label: '',
    particles: [],
    clouds: [],
    fog: [],
};
