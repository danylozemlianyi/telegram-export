describe('Main Page', function() {

    before(client => {
        this.home = client.page.main();
        this.navbar = this.home.section.navbar;
        this.main = this.home.section.main;
        this.home.navigate();
    });

    it('MAIN: Nav Bar', client => {
        this.navbar.expect.element('@home').to.be.visible;
        this.navbar.expect.element('@home').text.to.equal('Telegram Data Export');
        this.navbar.expect.element('@login').to.be.visible;
        this.navbar.expect.element('@login').text.to.equal('Sign in with Google 🚀');
    });

    it('MAIN: Not authenticated', client => {
        this.home.expect.section('@main').to.be.visible;
        this.home.expect.section('@main').text.to.equal('Not auth');
    });

    after(client => client.end());

});