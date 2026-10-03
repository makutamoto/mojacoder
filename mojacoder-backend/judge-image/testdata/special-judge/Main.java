import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Scanner;
public class Main {
    public static void main(String[] args) throws Exception {
        int input = Integer.parseInt(Files.readString(Path.of(args[0])).trim());
        int expected = Integer.parseInt(Files.readString(Path.of(args[1])).trim());
        int actual = new Scanner(System.in).nextInt();
        System.exit(input + 22 == expected && actual == expected ? 0 : 1);
    }
}
